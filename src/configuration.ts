import type { ViewerPresentationConfiguration } from '@pascal-app/viewer'
import { z } from 'zod'
import { createStore } from 'zustand/vanilla'

export const DAYLIGHT_PLUGIN_ID = 'blackforestdude:daylight'
export const DAYLIGHT_PRESENTATION_ID = `${DAYLIGHT_PLUGIN_ID}:presentation`
const degrees = z.number().finite().min(0).max(360)
const instant = z.iso.datetime({ offset: true }).refine((value) => {
  const year = new Date(value).getUTCFullYear()
  return year >= 1900 && year <= 2100
}, 'Use an explicit UTC/offset instant between 1900 and 2100')

export const DaylightConfigurationSchema = z
  .object({
    version: z.literal(1),
    enabled: z.boolean(),
    mode: z.enum(['manual', 'solar']),
    azimuth: degrees,
    elevation: z.number().finite().min(-90).max(90),
    northOffset: degrees,
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    instant,
    sunPower: z.number().finite().min(0).max(10),
    exposure: z.number().finite().min(0.1).max(4),
    presentationFill: z.number().finite().min(0).max(0.3),
  })
  .strict()

export type DaylightConfiguration = z.infer<typeof DaylightConfigurationSchema>
export const DEFAULT_DAYLIGHT: Readonly<DaylightConfiguration> = Object.freeze({
  version: 1,
  enabled: false,
  mode: 'manual',
  azimuth: 180,
  elevation: 35,
  northOffset: 0,
  latitude: 0,
  longitude: 0,
  instant: '2026-09-22T12:00:00Z',
  sunPower: 3,
  exposure: 1,
  presentationFill: 0,
})

export function createDaylightConfiguration(initial: unknown = DEFAULT_DAYLIGHT) {
  const store = createStore<DaylightConfiguration>(() => DaylightConfigurationSchema.parse(initial))
  function restore(input: unknown): DaylightConfiguration {
    const next = DaylightConfigurationSchema.parse(input)
    if (JSON.stringify(next) !== JSON.stringify(store.getState())) store.setState(next, true)
    return { ...next }
  }
  const configuration: ViewerPresentationConfiguration = {
    getSnapshot: () => ({ ...store.getState() }),
    restore,
    reset: () => {
      restore(DEFAULT_DAYLIGHT)
    },
    subscribe: (listener) => store.subscribe(listener),
  }
  return {
    store,
    configuration,
    restore,
    update: (patch: Partial<DaylightConfiguration>) => restore({ ...store.getState(), ...patch }),
    export: (): DaylightConfiguration => ({ ...store.getState() }),
  }
}

export const daylightState = createDaylightConfiguration()
export const daylightConfiguration = daylightState.configuration
export const exportDaylightConfiguration = daylightState.export
export const importDaylightConfiguration = daylightState.restore

export function parseDaylightFile(text: string): DaylightConfiguration {
  if (text.length > 16_384)
    throw new Error('Daylight preset is too large (maximum 16,384 characters).')
  return DaylightConfigurationSchema.parse(JSON.parse(text))
}
