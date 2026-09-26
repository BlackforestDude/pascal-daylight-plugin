import { expect, test } from 'bun:test'
import {
  createDaylightConfiguration,
  DEFAULT_DAYLIGHT,
  parseDaylightFile,
} from '../src/configuration.js'
import { lightingWarnings } from '../src/diagnostics.js'
import { daylightHostPanel, daylightPlugin, daylightPresentation } from '../src/index.js'

test('the opt-in API-v1 manifest is separate from lazy host UI and presentation', () => {
  expect(daylightPlugin).toEqual({ id: 'blackforestdude:daylight', apiVersion: 1, nodes: [] })
  expect(daylightHostPanel.pluginId).toBe(daylightPlugin.id)
  expect(daylightHostPanel.defaultInstalled).toBe(false)
  expect(daylightPresentation.pluginId).toBe(daylightPlugin.id)
  expect(typeof daylightHostPanel.component).toBe('function')
  expect(typeof daylightPresentation.component).toBe('function')
  expect(DEFAULT_DAYLIGHT.enabled).toBe(false)
  expect(DEFAULT_DAYLIGHT.presentationFill).toBe(0)
})

test('preset export is detached and import reproduces settings in an independent browser store', () => {
  const first = createDaylightConfiguration()
  const second = createDaylightConfiguration()
  first.update({ enabled: true, azimuth: 85, sunPower: 4, presentationFill: 0.06 })
  second.restore(parseDaylightFile(JSON.stringify(first.export())))
  expect(second.export()).toEqual(first.export())
  const snapshot = first.export()
  snapshot.azimuth = 10
  expect(first.export().azimuth).toBe(85)
  first.update({ azimuth: 90 })
  expect(second.export().azimuth).toBe(85)
})

test('invalid imports are atomic, including nonfinite, unknown, oversized and ambiguous-time inputs', () => {
  const state = createDaylightConfiguration()
  state.update({ sunPower: 2 })
  const before = state.export()
  const invalid: unknown[] = [
    { ...before, version: 2 },
    { ...before, sunPower: -1 },
    { ...before, exposure: NaN },
    { ...before, azimuth: Infinity },
    { ...before, latitude: 91 },
    { ...before, presentationFill: 0.5 },
    { ...before, instant: '2026-09-22T14:00:00' },
    { ...before, instant: '2200-01-01T00:00:00Z' },
    { ...before, surprise: 'remote script' },
    null,
  ]
  for (const input of invalid) {
    expect(() => state.restore(input)).toThrow()
    expect(state.export()).toEqual(before)
  }
  expect(() => parseDaylightFile('{')).toThrow()
  expect(() => parseDaylightFile(' '.repeat(16_385))).toThrow()
})

test('configuration subscriptions only signal changes, reset works and unsubscription releases observers', () => {
  const state = createDaylightConfiguration()
  let notifications = 0
  const unsubscribe = state.configuration.subscribe(() => {
    notifications++
  })
  state.restore(state.export())
  expect(notifications).toBe(0)
  state.update({ enabled: true })
  expect(notifications).toBe(1)
  state.configuration.reset()
  expect(state.export()).toEqual(DEFAULT_DAYLIGHT)
  expect(notifications).toBe(2)
  unsubscribe()
  state.update({ enabled: true })
  expect(notifications).toBe(2)
})

test('view diagnostics distinguish geometry, renderer and preview settings without writing host state', () => {
  const view = { shadows: true, levelMode: 'stacked', wallMode: 'up', shading: 'rendered' }
  expect(lightingWarnings(view)).toEqual([])
  expect(lightingWarnings(view, ['shadows', 'postFx'])).toHaveLength(2)
  expect(
    lightingWarnings({ shadows: false, levelMode: 'exploded', wallMode: 'down', shading: 'white' }),
  ).toHaveLength(4)
  expect(lightingWarnings({ ...view, levelMode: 'solo' })[0]).toContain(
    'inspect the full enclosure',
  )
  expect(view).toEqual({ shadows: true, levelMode: 'stacked', wallMode: 'up', shading: 'rendered' })
})
