export type LightingSamples = { windowFloor: number; frameFloor: number; roofFloor: number }
export type Evaluation = { passed: boolean; failures: string[] }
const regions = ['windowFloor', 'frameFloor', 'roofFloor'] as const

function evaluator(rows: Record<string, LightingSamples>, required: readonly string[]) {
  const failures: string[] = []
  for (const name of required) {
    const row = rows[name]
    for (const region of regions) {
      const value = row?.[region]
      if (!Number.isFinite(value) || value! < 0 || value! > 255)
        failures.push(`${name}.${region}: missing or invalid RGB mean`)
    }
  }
  const range = (name: string, region: keyof LightingSamples, min: number, max: number) => {
    const value = rows[name]?.[region]
    if (!(Number.isFinite(value) && value! >= min && value! <= max))
      failures.push(
        `${name}.${region}: expected ${min.toFixed(2)}…${max.toFixed(2)}, received ${value}`,
      )
  }
  // 8-bit readback: permit one quantization step for darkness, not an arbitrary fill.
  const dark = (name: string, region: keyof LightingSamples) => range(name, region, 0, 1)
  const lit = (name: string, region: keyof LightingSamples, reference?: number) =>
    reference === undefined
      ? range(name, region, 20, 250)
      : range(name, region, reference * 0.9 - 1, reference * 1.1 + 1)
  return { failures, range, dark, lit, valid: failures.length === 0 }
}

export function evaluateEnclosure(rows: Record<string, LightingSamples>): Evaluation {
  const e = evaluator(rows, ['sealed', 'window', 'roof-removed'])
  if (e.valid) {
    for (const region of regions) e.dark('sealed', region)
    e.lit('window', 'windowFloor')
    e.lit('window', 'frameFloor')
    e.dark('window', 'roofFloor')
    e.lit('roof-removed', 'roofFloor')
    // With the opening shuttered, the sun's roof footprint is behind these samples.
    e.dark('roof-removed', 'windowFloor')
    e.dark('roof-removed', 'frameFloor')
  }
  return { passed: e.failures.length === 0, failures: e.failures }
}

export function evaluateGlazing(rows: Record<string, LightingSamples>): Evaluation {
  const names = [
    'open-aperture',
    'glass-only',
    'glass-and-frame',
    'repainted-opaque',
    'glass-restored',
  ]
  const e = evaluator(rows, names)
  if (e.valid) {
    const baseline = rows['open-aperture']!
    e.lit('open-aperture', 'windowFloor')
    e.lit('open-aperture', 'frameFloor')
    for (const name of names) e.dark(name, 'roofFloor')
    for (const name of ['glass-only', 'glass-and-frame', 'glass-restored'])
      e.lit(name, 'windowFloor', baseline.windowFloor)
    e.lit('glass-only', 'frameFloor', baseline.frameFloor)
    for (const name of ['glass-and-frame', 'repainted-opaque', 'glass-restored'])
      e.dark(name, 'frameFloor')
    e.dark('repainted-opaque', 'windowFloor')
  }
  return { passed: e.failures.length === 0, failures: e.failures }
}
