import { expect, test } from 'bun:test'
import { createDaylightAtmosphere, updateDaylightAtmosphere } from '../src/atmosphere.js'
import { DEFAULT_DAYLIGHT } from '../src/configuration.js'
import { sunAngles, sunDirection } from '../src/solar.js'

test('compass angles match the declared right-handed Pascal axes, including north rotation', () => {
  const cases = [
    [0, 0, 0, 0, 0, -1],
    [90, 0, 0, 1, 0, 0],
    [180, 0, 0, 0, 0, 1],
    [270, 0, 0, -1, 0, 0],
    [0, 90, 0, 0, 1, 0],
    [0, 0, 90, 1, 0, 0],
  ]
  for (const [az, el, north, x, y, z] of cases) {
    const direction = sunDirection(az!, el!, north!)
    expect(direction[0]).toBeCloseTo(x!, 10)
    expect(direction[1]).toBeCloseTo(y!, 10)
    expect(direction[2]).toBeCloseTo(z!, 10)
  }
})

test('solar instants are timezone-independent and noon/summer behavior is physically plausible', () => {
  const config = {
    ...DEFAULT_DAYLIGHT,
    mode: 'solar' as const,
    latitude: 51,
    longitude: 0,
    instant: '2026-06-21T12:00:00Z',
  }
  const sun = sunAngles(config)
  expect(sun.azimuth).toBeGreaterThan(175)
  expect(sun.azimuth).toBeLessThan(185)
  expect(sun.elevation).toBeGreaterThan(60)
  expect(sun.elevation).toBeLessThan(65)
  expect(sunAngles({ ...config, instant: '2026-06-21T14:00:00+02:00' })).toEqual(sun)
  expect(sunAngles({ ...config, instant: '2026-06-21T00:00:00Z' }).elevation).toBeLessThan(0)
})

test('direct-only mode introduces no global fill, moon or below-horizon light', () => {
  const source = createDaylightAtmosphere({ ...DEFAULT_DAYLIGHT, elevation: -10 })
  expect(source.sunIntensity).toBe(0)
  expect(source.ambientIntensity).toBe(0)
  expect(source.hemisphereIntensity).toBe(0)
  expect(source.moonIntensity).toBe(0)
  updateDaylightAtmosphere(source, { ...DEFAULT_DAYLIGHT, elevation: 0 })
  expect(source.sunIntensity).toBe(0)
  updateDaylightAtmosphere(source, {
    ...DEFAULT_DAYLIGHT,
    elevation: 30,
    sunPower: 4,
    presentationFill: 0.08,
  })
  expect(source.sunIntensity).toBe(4)
  expect(source.ambientIntensity).toBe(0.08)
})

test('10,000 setting updates retain source/TSL/vector identities and finite normalized directions', () => {
  const source = createDaylightAtmosphere(DEFAULT_DAYLIGHT)
  const direction = source.sunDirection
  const environment = source.environmentNode
  const sky = source.skyRadiance
  for (let i = 0; i < 10_000; i++) {
    updateDaylightAtmosphere(source, {
      ...DEFAULT_DAYLIGHT,
      azimuth: i % 360,
      elevation: (i % 181) - 90,
    })
    expect(source.sunDirection).toBe(direction)
    expect(source.environmentNode).toBe(environment)
    expect(source.skyRadiance).toBe(sky)
    expect(direction.length()).toBeCloseTo(1, 10)
  }
})
