import { getPosition } from 'suncalc'
import type { DaylightConfiguration } from './configuration.js'

export function sunAngles(config: DaylightConfiguration): { azimuth: number; elevation: number } {
  if (config.mode === 'manual') return { azimuth: config.azimuth, elevation: config.elevation }
  const result = getPosition(new Date(config.instant), config.latitude, config.longitude)
  return { azimuth: result.azimuth, elevation: result.altitude }
}

export function sunDirection(
  azimuth: number,
  elevation: number,
  northOffset = 0,
): [number, number, number] {
  const az = ((azimuth + northOffset) * Math.PI) / 180
  const el = (elevation * Math.PI) / 180
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]
}
