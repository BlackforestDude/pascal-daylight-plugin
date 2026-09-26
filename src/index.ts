import type { Plugin } from '@pascal-app/core'
import type { EditorHostPanel } from '@pascal-app/editor'
import type { ViewerPresentationContribution } from '@pascal-app/viewer'
import {
  DAYLIGHT_PLUGIN_ID,
  DAYLIGHT_PRESENTATION_ID,
  daylightConfiguration,
} from './configuration.js'

export const daylightPlugin: Plugin = { id: DAYLIGHT_PLUGIN_ID, apiVersion: 1, nodes: [] }
export const daylightHostPanel: EditorHostPanel = {
  id: `${DAYLIGHT_PLUGIN_ID}:panel`,
  pluginId: DAYLIGHT_PLUGIN_ID,
  label: 'Daylight',
  description:
    'Offline sun studies and portable lighting presets. Raster preview, not calibrated photometry.',
  creator: { name: 'BlackforestDude', url: 'https://github.com/BlackforestDude' },
  icon: {
    kind: 'svg',
    viewBox: '0 0 24 24',
    path: 'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM3 4.4 4.4 3 7 5.6 5.6 7zM17 18.4l1.4-1.4 2.6 2.6-1.4 1.4zM3 19.6 5.6 17 7 18.4 4.4 21zM17 5.6 19.6 3 21 4.4 18.4 7z',
  },
  component: () => import('./panel.js'),
  kinds: [],
  defaultInstalled: false,
}
export const daylightPresentation: ViewerPresentationContribution = {
  id: DAYLIGHT_PRESENTATION_ID,
  pluginId: DAYLIGHT_PLUGIN_ID,
  component: () => import('./presentation-runtime.js'),
  configuration: daylightConfiguration,
}
export type { DaylightConfiguration } from './configuration.js'
export {
  DaylightConfigurationSchema,
  exportDaylightConfiguration,
  importDaylightConfiguration,
} from './configuration.js'
