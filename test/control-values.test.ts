import { expect, test } from 'bun:test'
import {
  compassAngle,
  compassLabel,
  instantFromLocal,
  localDateTime,
} from '../src/control-values.js'

test('pointer directions follow the compass and crossing north never produces an out-of-range preset', () => {
  expect(compassAngle(0, -100)).toBe(0)
  expect(compassAngle(100, 0)).toBe(90)
  expect(compassAngle(0, 100)).toBe(180)
  expect(compassAngle(-100, 0)).toBe(270)
  expect(compassAngle(-1, -100)).toBe(359)
  expect(compassAngle(1, -100)).toBe(1)
  expect(compassAngle(0, 0)).toBeNull()
  expect(compassLabel(360)).toBe('North')
})

test('an ordinary date picker round trip preserves the absolute moment at device-local time', () => {
  const instant = '2026-07-08T12:30:45.000Z'
  expect(instantFromLocal(localDateTime(instant))).toBe(instant)
})

test('incomplete and impossible calendar input cannot silently roll over into a different day', () => {
  for (const value of [
    '',
    '2026-02-30T12:00',
    '2026-13-01T12:00',
    '2026-07-08T24:00',
    '1899-07-08T12:00',
    '2101-07-08T12:00',
  ])
    expect(() => instantFromLocal(value)).toThrow()
})
