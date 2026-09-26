import { DaylightConfigurationSchema, daylightPresentation } from '../src/index.js'

export function captureProjectDaylight() {
  return DaylightConfigurationSchema.parse(daylightPresentation.configuration!.getSnapshot())
}

export function restoreProjectDaylight(saved: unknown) {
  if (saved === undefined) {
    daylightPresentation.configuration!.reset()
    return
  }
  const validated = DaylightConfigurationSchema.parse(saved)
  daylightPresentation.configuration!.restore(validated)
}
