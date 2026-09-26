import { afterEach, expect, test } from 'bun:test'
import { SceneAtmosphere, type SceneAtmosphereSource, useSceneAtmosphere } from '@pascal-app/viewer'
import { act, create } from '@react-three/test-renderer'
import type { Scene } from 'three/webgpu'
import { createDaylightAtmosphere } from '../src/atmosphere.js'
import { DEFAULT_DAYLIGHT, daylightState } from '../src/configuration.js'
import DaylightPresentation, { daylightRuntimeStatus } from '../src/presentation-runtime.js'

afterEach(() => daylightState.configuration.reset())

test('two viewers own independent atmosphere resources and uninstall restores each scene', async () => {
  const first = await create(<DaylightPresentation />)
  const second = await create(<DaylightPresentation />)
  const firstScene = first.scene.instance as Scene
  const secondScene = second.scene.instance as Scene
  const firstBase = firstScene.environmentNode
  const secondBase = secondScene.environmentNode
  try {
    await act(async () => {
      daylightState.update({ enabled: true })
    })
    const secondNode = secondScene.environmentNode
    expect(firstScene.environmentNode).not.toBe(secondNode)
    expect(daylightRuntimeStatus.getState().owners.size).toBe(2)
    await first.update(<group />)
    expect(firstScene.environmentNode).toBe(firstBase)
    expect(secondScene.environmentNode).toBe(secondNode)
    expect(daylightRuntimeStatus.getState().owners.size).toBe(1)
    await second.update(<group />)
    expect(secondScene.environmentNode).toBe(secondBase)
    expect(daylightRuntimeStatus.getState().owners.size).toBe(0)
  } finally {
    await first.unmount()
    await second.unmount()
  }
})

test('a competing atmosphere takes precedence and removing it restores Daylight without a tug of war', async () => {
  daylightState.update({ enabled: true })
  const other = createDaylightAtmosphere({ ...DEFAULT_DAYLIGHT, sunPower: 8 })
  let active: SceneAtmosphereSource | null = null
  function Probe() {
    active = useSceneAtmosphere()
    return null
  }
  function Harness({ competitor }: { competitor: boolean }) {
    return (
      <>
        <DaylightPresentation />
        {competitor && <SceneAtmosphere source={other} />}
        <Probe />
      </>
    )
  }
  const renderer = await create(<Harness competitor={false} />)
  try {
    expect(active).not.toBeNull()
    expect(active).not.toBe(other)
    await renderer.update(<Harness competitor />)
    expect(active as SceneAtmosphereSource | null).toBe(other)
    expect([...daylightRuntimeStatus.getState().owners.values()]).toEqual(['other-atmosphere'])
    await renderer.update(<Harness competitor={false} />)
    expect(active).not.toBeNull()
    expect(active).not.toBe(other)
    expect([...daylightRuntimeStatus.getState().owners.values()]).toEqual(['active'])
  } finally {
    await renderer.unmount()
  }
})

test('100 enable/disable cycles restore the base environment and release diagnostics', async () => {
  const renderer = await create(<DaylightPresentation />)
  const scene = renderer.scene.instance as Scene
  const baseNode = scene.environmentNode
  try {
    for (let i = 0; i < 100; i++) {
      await act(async () => {
        daylightState.update({ enabled: true, azimuth: i })
      })
      expect(scene.environmentNode).not.toBe(baseNode)
      await act(async () => {
        daylightState.update({ enabled: false })
      })
      expect(scene.environmentNode).toBe(baseNode)
      expect(daylightRuntimeStatus.getState().owners.size).toBe(1)
    }
  } finally {
    await renderer.unmount()
  }
  expect(daylightRuntimeStatus.getState().owners.size).toBe(0)
})
