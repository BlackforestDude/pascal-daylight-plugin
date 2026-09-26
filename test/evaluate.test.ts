import { expect, test } from 'bun:test'
import { evaluateEnclosure, evaluateGlazing, type LightingSamples } from '../lab/evaluate'

const samples = (windowFloor: number, frameFloor: number, roofFloor = 0): LightingSamples => ({
  windowFloor,
  frameFloor,
  roofFloor,
})
const enclosure = {
  sealed: samples(0, 0),
  window: samples(92, 92),
  'roof-removed': samples(0, 0, 91),
}
const glazing = {
  'open-aperture': samples(92, 92),
  'glass-only': samples(92, 92),
  'glass-and-frame': samples(92, 0),
  'repainted-opaque': samples(0, 0),
  'glass-restored': samples(92, 0),
}
test('accepts bounded reference values, rejects each missing row and nonfinite/out-of-range region', () => {
  for (const [good, evaluate] of [
    [enclosure, evaluateEnclosure],
    [glazing, evaluateGlazing],
  ] as const) {
    expect(evaluate(good).passed).toBe(true)
    for (const name of Object.keys(good)) {
      const missing: Record<string, LightingSamples> = structuredClone(good)
      delete missing[name]
      expect(evaluate(missing).passed).toBe(false)
      for (const region of ['windowFloor', 'frameFloor', 'roofFloor'] as const) {
        for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1, 256]) {
          const rows: Record<string, LightingSamples> = structuredClone(good)
          rows[name]![region] = bad
          expect(evaluate(rows).passed).toBe(false)
        }
      }
    }
  }
})
test('rejects the audit false-PASS counterexamples', () => {
  for (const [name, region, value] of [
    ['glass-only', 'windowFloor', 0],
    ['glass-only', 'frameFloor', 0],
    ['repainted-opaque', 'frameFloor', 92],
    ['glass-and-frame', 'windowFloor', 200],
    ['glass-restored', 'windowFloor', 200],
  ] as const) {
    const rows = structuredClone(glazing)
    rows[name][region] = value
    expect(evaluateGlazing(rows).passed).toBe(false)
  }
  for (const [name, region] of [
    ['window', 'roofFloor'],
    ['roof-removed', 'windowFloor'],
    ['roof-removed', 'frameFloor'],
    ['sealed', 'frameFloor'],
  ] as const) {
    const rows = structuredClone(enclosure)
    rows[name][region] = 92
    expect(evaluateEnclosure(rows).passed).toBe(false)
  }
})
test('each required region independently detects inverted light transport', () => {
  for (const [good, evaluate] of [
    [enclosure, evaluateEnclosure],
    [glazing, evaluateGlazing],
  ] as const) {
    for (const [name, row] of Object.entries(good)) {
      for (const region of ['windowFloor', 'frameFloor', 'roofFloor'] as const) {
        const rows: Record<string, LightingSamples> = structuredClone(good)
        rows[name]![region] = row[region] > 20 ? 0 : 92
        expect(evaluate(rows).passed).toBe(false)
      }
    }
  }
})
