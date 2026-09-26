import type { SceneAtmosphereSource } from '@pascal-app/viewer'
import { vec3 } from 'three/tsl'
import { Color, Vector3 } from 'three/webgpu'
import type { DaylightConfiguration } from './configuration.js'
import { sunAngles, sunDirection } from './solar.js'

export function createDaylightAtmosphere(config: DaylightConfiguration): SceneAtmosphereSource {
  const black = vec3(0)
  const sky = vec3(0.3, 0.4, 0.5)
  const source: SceneAtmosphereSource = {
    skyRadiance: () => sky,
    reflectionRadiance: () => black,
    fogRadiance: () => sky,
    environmentNode: black,
    sunDirection: new Vector3(),
    sunColor: new Color('#fffaf2'),
    sunIntensity: 0,
    moonDirection: new Vector3(0, -1, 0),
    moonColor: new Color('#ffffff'),
    moonIntensity: 0,
    skyColor: new Color('#ffffff'),
    groundColor: new Color('#ffffff'),
    hemisphereIntensity: 0,
    ambientIntensity: 0,
    exposure: 1,
    fogStart: 1_000_000,
    fogEnd: 2_000_000,
  }
  updateDaylightAtmosphere(source, config)
  return source
}

export function updateDaylightAtmosphere(
  source: SceneAtmosphereSource,
  config: DaylightConfiguration,
): void {
  const angles = sunAngles(config)
  source.sunDirection.set(...sunDirection(angles.azimuth, angles.elevation, config.northOffset))
  source.sunIntensity = angles.elevation > 0 ? config.sunPower : 0
  source.ambientIntensity = config.presentationFill
  source.exposure = config.exposure
}
