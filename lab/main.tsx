import { getCeilingMaterials } from '@host/ceiling-materials'
import { Lights } from '@host/lights'
import { type AnyNodeId, useRegistry } from '@pascal-app/core'
import {
  detectRendererCapability,
  SceneAtmosphere,
  useSceneAtmosphere,
  useViewer,
} from '@pascal-app/viewer'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ACESFilmicToneMapping,
  type Group,
  PerspectiveCamera,
  RenderTarget,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu'
import { createDaylightAtmosphere } from '../src/atmosphere.js'
import { DEFAULT_DAYLIGHT, daylightState } from '../src/configuration.js'
import DaylightPanel from '../src/panel.js'
import DaylightPresentation from '../src/presentation-runtime.js'
import { evaluateEnclosure, evaluateGlazing } from './evaluate.js'
import { Glazing, type GlazingState } from './glazing.js'
import '../src/styles.css'
import './styles.css'

useViewer.setState({ shadows: true, levelMode: 'stacked', wallMode: 'up', shading: 'rendered' })
daylightState.update({ enabled: true, azimuth: 0, elevation: 55, presentationFill: 0 })
const competitor = createDaylightAtmosphere({ ...DEFAULT_DAYLIGHT, sunPower: 1 })
type Capture = {
  windowFloor: number
  roofFloor: number
  frameFloor: number
  geometries: number
  textures: number
  gpuMemory: Record<string, number>
  cumulativeDrawCalls: number
  backend: string
  image: string
}
type SceneControls = { roof: boolean; window: boolean; mounted: boolean; competitor: boolean }
type Request = { resolve: (result: Capture) => void; reject: (error: unknown) => void }

function Room({ roof, window: windowOpen }: Pick<SceneControls, 'roof' | 'window'>) {
  const ref = useRef<Group>(null!)
  useRegistry('block_daylight_lab' as AnyNodeId, 'block', ref)
  const walls: [number[], number[]][] = [
    [
      [-1.56, 1.25, 0],
      [0.12, 2.5, 4.24],
    ],
    [
      [1.56, 1.25, 0],
      [0.12, 2.5, 4.24],
    ],
    [
      [0, 1.25, 2.06],
      [3, 2.5, 0.12],
    ],
    [
      [-1.05, 1.25, -2.06],
      [0.9, 2.5, 0.12],
    ],
    [
      [1.05, 1.25, -2.06],
      [0.9, 2.5, 0.12],
    ],
    [
      [0, 0.5, -2.06],
      [1.2, 1, 0.12],
    ],
    [
      [0, 2.35, -2.06],
      [1.2, 0.3, 0.12],
    ],
  ]
  return (
    <group ref={ref}>
      <mesh receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[3.24, 0.12, 4.24]} />
        <meshStandardMaterial color="#bdb8a9" roughness={0.8} />
      </mesh>
      {walls.map(([position, size], i) => (
        <mesh key={i} castShadow receiveShadow position={position as [number, number, number]}>
          <boxGeometry args={size as [number, number, number]} />
          <meshStandardMaterial color="#f2f0e8" />
        </mesh>
      ))}
      {!windowOpen && (
        <mesh castShadow receiveShadow position={[0, 1.6, -2.06]}>
          <boxGeometry args={[1.2, 1.2, 0.12]} />
          <meshStandardMaterial color="#f2f0e8" />
        </mesh>
      )}
      {roof && (
        <mesh
          castShadow
          receiveShadow
          position={[0, 2.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={getCeilingMaterials('#eeeeee').bottomMaterial}
        >
          <planeGeometry args={[3.24, 4.24]} />
        </mesh>
      )}
    </group>
  )
}

function CaptureProbe({
  request,
  onReady,
}: {
  request: React.RefObject<Request | null>
  onReady: (backend: string) => void
}) {
  const { gl, scene, camera } = useThree()
  const atmosphere = useSceneAtmosphere()
  useFrame(() => {
    gl.toneMappingExposure = atmosphere?.exposure ?? 1
  }, -1)
  const frame = useRef(0)
  const busy = useRef(false)
  useLayoutEffect(() => {
    camera.lookAt(0, 0.6, -1)
    camera.updateMatrixWorld()
  }, [camera])
  useEffect(() => {
    const backend = (gl as unknown as { backend: { isWebGPUBackend?: boolean } }).backend
    onReady(backend.isWebGPUBackend ? 'WebGPU initialized' : 'WebGL fallback initialized')
  }, [gl, onReady])
  useFrame(() => {
    frame.current++
    if (!request.current || busy.current || frame.current < 40) return
    const pending = request.current
    request.current = null
    busy.current = true
    const renderer = gl as unknown as WebGPURenderer
    const target = new RenderTarget(640, 480)
    const captureCamera = camera.clone()
    if (captureCamera instanceof PerspectiveCamera) {
      captureCamera.aspect = 640 / 480
      captureCamera.updateProjectionMatrix()
    }
    const previousTarget = renderer.getRenderTarget()
    try {
      renderer.setRenderTarget(target)
      renderer.render(scene, captureCamera)
    } catch (error) {
      target.dispose()
      busy.current = false
      pending.reject(error)
      return
    } finally {
      renderer.setRenderTarget(previousTarget)
    }
    const projected = (point: [number, number, number]) =>
      new Vector3(...point).project(captureCamera)
    const a = projected([0, 0.01, -0.8])
    const b = projected([0, 0.01, 0.5])
    const c = projected([0.35, 0.01, -0.8])
    const backend = (renderer as unknown as { backend: { isWebGPUBackend?: boolean } }).backend
      .isWebGPUBackend
      ? 'WebGPU'
      : 'WebGL fallback'
    renderer
      .readRenderTargetPixelsAsync(target, 0, 0, 640, 480)
      .then((pixels) => {
        const raw = pixels as Uint8Array
        const data = new Uint8ClampedArray(raw.length)
        for (let y = 0; y < 480; y++) {
          const sourceY = backend === 'WebGPU' ? y : 479 - y
          data.set(raw.subarray(sourceY * 640 * 4, (sourceY + 1) * 640 * 4), y * 640 * 4)
        }
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Evidence canvas unavailable')
        context.putImageData(new ImageData(data, 640, 480), 0, 0)
        const sample = (p: Vector3) => {
          const x = Math.round((p.x + 1) * 320)
          const y = Math.round((1 - p.y) * 240)
          if (x < 8 || x > 631 || y < 8 || y > 471)
            throw new Error('Sample point outside the fixed camera.')
          let sum = 0
          for (let dy = -4; dy <= 4; dy++)
            for (let dx = -4; dx <= 4; dx++) {
              const offset = ((y + dy) * 640 + x + dx) * 4
              sum += (data[offset]! + data[offset + 1]! + data[offset + 2]!) / 3
            }
          return sum / 81
        }
        pending.resolve({
          windowFloor: sample(a),
          roofFloor: sample(b),
          frameFloor: sample(c),
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          gpuMemory: { ...renderer.info.memory },
          cumulativeDrawCalls: renderer.info.render.calls,
          backend,
          image: canvas.toDataURL('image/png'),
        })
      })
      .catch(pending.reject)
      .finally(() => {
        target.dispose()
        busy.current = false
      })
  })
  return null
}

function App() {
  const [controls, setControls] = useState<SceneControls>({
    roof: true,
    window: true,
    mounted: true,
    competitor: false,
  })
  const [status, setStatus] = useState('Initializing renderer…')
  const [results, setResults] = useState<Record<string, Capture>>({})
  const [running, setRunning] = useState(false)
  const [glazing, setGlazing] = useState<GlazingState>('none')
  const [materialReport, setMaterialReport] = useState('')
  const [gpuStatus, setGpuStatus] = useState('')
  const request = useRef<Request | null>(null)
  const ready = useRef((backend: string) => setStatus(backend))
  const settle = () =>
    new Promise<void>((resolve, reject) => {
      let frames = 0
      let frameId = 0
      const timeout = setTimeout(() => {
        cancelAnimationFrame(frameId)
        reject(new Error('Frame settling timed out. Keep the lab tab active and retry.'))
      }, 10_000)
      const step = () => {
        if (++frames >= 30) {
          clearTimeout(timeout)
          resolve()
        } else frameId = requestAnimationFrame(step)
      }
      frameId = requestAnimationFrame(step)
    })
  const capture = () =>
    new Promise<Capture>((resolve, reject) => {
      const timeout = setTimeout(() => {
        request.current = null
        reject(new Error('GPU capture timed out'))
      }, 15_000)
      request.current = {
        resolve: (result) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      }
    })
  const run = async () => {
    setGlazing('none')
    setRunning(true)
    setResults({})
    const saved = daylightState.export()
    try {
      daylightState.restore({ ...DEFAULT_DAYLIGHT, enabled: true, azimuth: 0, elevation: 55 })
      const output: Record<string, Capture> = {}
      for (const [name, roof, windowOpen] of [
        ['sealed', true, false],
        ['window', true, true],
        ['roof-removed', false, false],
      ] as const) {
        setStatus(`Checking ${name}…`)
        setControls({ roof, window: windowOpen, mounted: true, competitor: false })
        await settle()
        output[name] = await capture()
        setResults({ ...output })
      }
      const { passed, failures } = evaluateEnclosure(output)
      setStatus(passed ? 'PASS: roof and window occlusion checks' : `FAIL: ${failures.join('; ')}`)
    } catch (error) {
      setStatus(String(error))
    } finally {
      daylightState.restore(saved)
      setControls({ roof: true, window: true, mounted: true, competitor: false })
      setRunning(false)
    }
  }
  const checkGlazing = async () => {
    setRunning(true)
    setResults({})
    const saved = daylightState.export()
    try {
      daylightState.restore({ ...DEFAULT_DAYLIGHT, enabled: true, azimuth: 0, elevation: 55 })
      setControls({ roof: true, window: true, mounted: true, competitor: false })
      const output: Record<string, Capture> = {}
      for (const [name, state] of [
        ['open-aperture', 'none'],
        ['glass-only', 'glass-only'],
        ['glass-and-frame', 'glass'],
        ['repainted-opaque', 'opaque'],
        ['glass-restored', 'glass'],
      ] as const) {
        setStatus(`Checking ${name}…`)
        setGlazing(state)
        await settle()
        output[name] = await capture()
        setResults({ ...output })
      }
      const { passed, failures } = evaluateGlazing(output)
      setStatus(
        passed
          ? 'PASS: native block glass passes light; its frame and opaque repaint block it; roof stays opaque'
          : `FAIL: ${failures.join('; ')}`,
      )
    } catch (error) {
      setStatus(String(error))
    } finally {
      daylightState.restore(saved)
      setGlazing('glass')
      setRunning(false)
    }
  }
  const stress = async () => {
    setGlazing('none')
    setRunning(true)
    try {
      setControls({ roof: true, window: true, mounted: true, competitor: false })
      const cycle = async () => {
        setControls((state) => ({ ...state, mounted: false }))
        await settle()
        setControls((state) => ({ ...state, mounted: true }))
        await settle()
      }
      for (let i = 0; i < 3; i++) await cycle()
      const before = await capture()
      for (let i = 0; i < 20; i++) {
        setStatus(`GPU lifecycle stress ${i + 1}/20…`)
        await cycle()
      }
      const after = await capture()
      setResults({ 'stress-before': before, 'stress-after': after })
      setStatus(
        before.geometries === after.geometries && before.textures === after.textures
          ? 'PASS: stable geometry/texture counts after 20 GPU remount cycles'
          : 'FAIL: GPU resource counts changed; investigate before release',
      )
    } catch (error) {
      setStatus(String(error))
    } finally {
      setRunning(false)
    }
  }
  const checkGpu = async () => {
    type GPU = NonNullable<NonNullable<Parameters<typeof detectRendererCapability>[0]>['gpu']>
    const gpu = (navigator as unknown as { gpu?: GPU }).gpu
    if (!gpu) {
      setGpuStatus('WebGPU is not exposed')
      return
    }
    const output: string[] = []
    for (const strategy of ['host-compatibility-request', 'default-adapter-request']) {
      const start = performance.now()
      const capability = await detectRendererCapability({
        gpu:
          strategy === 'host-compatibility-request'
            ? gpu
            : {
                requestAdapter: ({ powerPreference } = {}) =>
                  gpu.requestAdapter({ powerPreference }),
              },
      })
      output.push(
        `${strategy}: ${capability.status === 'supported' ? capability.backend : 'unsupported'} (${Math.round(performance.now() - start)} ms)`,
      )
      if (capability.status === 'supported' && capability.backend === 'webgpu')
        (capability.device as { destroy?: () => void }).destroy?.()
    }
    setGpuStatus(output.join('\n'))
  }
  const downloadEvidence = async () => {
    try {
      const entries = Object.entries(results)
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = entries.length * 520
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Evidence canvas unavailable')
      for (const [index, [name, result]] of entries.entries()) {
        const image = new Image()
        image.src = result.image
        await image.decode()
        context.fillStyle = '#18181c'
        context.fillRect(0, index * 520, 640, 520)
        context.fillStyle = '#ffffff'
        context.font = '16px sans-serif'
        context.fillText(
          `${name} · ${result.backend} · glass/frame/roof ${result.windowFloor.toFixed(1)} / ${result.frameFloor.toFixed(1)} / ${result.roofFloor.toFixed(1)}`,
          12,
          index * 520 + 26,
        )
        context.drawImage(image, 0, index * 520 + 40)
      }
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `pascal-daylight-${results['glass-and-frame'] ? 'glazing' : 'enclosure'}-${entries[0]?.[1].backend === 'WebGPU' ? 'webgpu' : 'webgl'}.png`
      link.click()
    } catch (error) {
      setStatus(String(error))
    }
  }
  return (
    <main>
      <aside inert={running}>
        <DaylightPanel />
      </aside>
      <section className="lab-stage" aria-label="Enclosure test scene">
        <header className="lab-toolbar">
          <h1>Pascal Daylight · enclosure lab</h1>
          <p>3 × 4 m room · 2.5 m high · 1.2 × 1.2 m opening · fixed camera</p>
          <div className="lab-actions">
            {(['roof', 'window', 'mounted', 'competitor'] as const).map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  disabled={running}
                  checked={controls[key]}
                  onChange={(event) => setControls({ ...controls, [key]: event.target.checked })}
                />{' '}
                {key === 'mounted'
                  ? 'Plugin mounted'
                  : key === 'window'
                    ? 'Window open'
                    : key === 'competitor'
                      ? 'Other atmosphere'
                      : 'Roof present'}
              </label>
            ))}
            <button disabled={running} onClick={run} type="button">
              Run enclosure checks
            </button>
            <button disabled={running} onClick={checkGlazing} type="button">
              Run native glazing checks
            </button>
          </div>
          <div className="lab-actions">
            <button disabled={running} onClick={stress} type="button">
              Stress GPU lifecycle
            </button>
            <button disabled={running} onClick={checkGpu} type="button">
              Check host GPU selection
            </button>
            <button
              disabled={running || Object.keys(results).length === 0}
              onClick={downloadEvidence}
              type="button"
            >
              Download measured frames
            </button>
          </div>
          <p role="status">{status}</p>
          <section aria-label="Host GPU selection">
            <pre>{gpuStatus}</pre>
          </section>
        </header>
        <div className="lab-canvas">
          <Canvas
            shadows
            camera={{ position: [0, 1.9, 1.8], fov: 85, near: 0.02, far: 50 }}
            gl={async (props) => {
              const renderer = new WebGPURenderer({
                canvas: props.canvas as HTMLCanvasElement,
                antialias: true,
                forceWebGL: new URLSearchParams(location.search).get('backend') === 'webgl',
              })
              renderer.toneMapping = ACESFilmicToneMapping
              await renderer.init()
              return renderer
            }}
          >
            <color attach="background" args={['#879dac']} />
            <Lights />
            <Room roof={controls.roof} window={controls.window} />
            {glazing !== 'none' && <Glazing state={glazing} onReport={setMaterialReport} />}
            {controls.mounted && <DaylightPresentation />}
            {controls.competitor && <SceneAtmosphere source={competitor} />}
            <CaptureProbe request={request} onReady={ready.current} />
          </Canvas>
        </div>
        <section aria-label="Measured enclosure results">
          <pre className="lab-results">
            {JSON.stringify(results, (key, value) => (key === 'image' ? undefined : value), 2)}
          </pre>
        </section>
        <section aria-label="Native material diagnostics">
          <pre>{materialReport}</pre>
        </section>
        <p className="lab-caption">
          Test harness only. Uses host Lights, ceiling material and native mixed-slot block
          geometry; excludes post-processing. Samples are 9 × 9 pixel RGB means, not lux. Main
          editor verification is separate.
        </p>
      </section>
    </main>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
