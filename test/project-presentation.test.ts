import { afterEach, expect, test } from 'bun:test'
import { captureProjectDaylight, restoreProjectDaylight } from '../examples/project-presentation'
import { DEFAULT_DAYLIGHT, daylightState } from '../src/configuration'

afterEach(() => daylightState.configuration.reset())

test('a fresh viewer restores the saved preset and a different project starts disabled', () => {
  daylightState.update({ enabled: true, mode: 'solar', latitude: 47, longitude: 8, sunPower: 4 })
  const saved = JSON.parse(JSON.stringify(captureProjectDaylight()))
  daylightState.configuration.reset()
  restoreProjectDaylight(saved)
  expect(captureProjectDaylight()).toEqual(saved)
  restoreProjectDaylight(undefined)
  expect(captureProjectDaylight()).toEqual(DEFAULT_DAYLIGHT)
})

test('a malformed saved project never partially replaces the active lighting configuration', () => {
  daylightState.update({ enabled: true, azimuth: 80 })
  const before = captureProjectDaylight()
  expect(() => restoreProjectDaylight({ ...before, exposure: -3 })).toThrow()
  expect(captureProjectDaylight()).toEqual(before)
})
