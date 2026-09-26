import { extendPluginDiscovery } from '@pascal-app/core'
import { registerEditorHostPanel } from '@pascal-app/editor'
import { registerViewerPresentation } from '@pascal-app/viewer'
import { daylightHostPanel, daylightPlugin, daylightPresentation } from '../src/index.js'

extendPluginDiscovery(async () => [daylightPlugin])
registerEditorHostPanel(daylightHostPanel)
registerViewerPresentation(daylightPresentation)
