# Host integration

## Package and bootstrap

Pin the release archive by SHA-256 or an immutable repository commit. Install it as
`pascal-daylight-plugin` in the host application's dependencies. Pascal, React, React DOM,
Three, React Three Fiber, Zustand and Zod must resolve to the host's shared peer runtimes.

```ts
import { extendPluginDiscovery } from '@pascal-app/core'
import { registerEditorHostPanel } from '@pascal-app/editor'
import { registerViewerPresentation } from '@pascal-app/viewer'
import { daylightPlugin, daylightHostPanel, daylightPresentation } from 'pascal-daylight-plugin'

extendPluginDiscovery(async () => [daylightPlugin])
registerEditorHostPanel(daylightHostPanel)
registerViewerPresentation(daylightPresentation)
```

Register before the app invokes plugin discovery. Import
`pascal-daylight-plugin/styles.css` in the host stylesheet. Its classes are scoped;
it uses existing colour tokens and requires no Tailwind source scan.

The standard Editor mounts `ViewerPresentations` in edit and preview compositions.
A raw Viewer must mount it exactly once inside the canvas. Include the plugin ID in
the scene's `installedPlugins` only when the project owner installs it. Leave
`defaultInstalled: false`. There are no contributed semantic nodes or server routes.

## Project save and public viewing

The plugin exposes a versioned configuration via `daylightPresentation.configuration`
and `exportDaylightConfiguration` / `importDaylightConfiguration`. The host owns persistence,
authentication, revision/conflict policy and publication visibility.

On project save, capture a detached configuration with `getSnapshot()` alongside the host's
existing project revision. On project load, validate and restore its saved configuration
before mounting presentation. Reset when switching to a project without a saved preset.
`examples/project-presentation.ts` demonstrates this boundary without adding a storage service.
Invalid input must be reported; do not silently substitute another project's settings.

The public viewer needs the same package, installed-plugin ID, saved configuration and
relevant Display settings. Browser-local storage is insufficient for a different visitor.
The plugin neither grants access nor changes project visibility. A single runtime configuration
is shared across views of one active project; simultaneous different projects require separate
host/store isolation. There is no portable cross-project singleton isolation in this release.

Cloud integration acceptance belongs in Pascal's hosted application: save a preset, reload,
open its authorized public viewer in a fresh browser, compare sun direction/exposure/fill,
and switch to an unconfigured project to verify reset. Hosted behaviour is not certified by
the standalone lab or the unit-level persistence example.

## Viewer lifecycle and export

Daylight gives way to an already active atmosphere. Turn that atmosphere off through its own
controls before using Daylight. Unmount/disable releases the scene's atmosphere and diagnostics.
Resources are owned per R3F scene; no scene nodes, history entries or selection targets are added.
Daylight does not alter materials, camera, global display preferences or the host's data stores.

GLB/USDZ model export does not carry executable Daylight controls or its live atmosphere.
Snapshots can capture the visible lighting through the host's capture pipeline; verify that
pipeline separately. These files do not implement a new server adapter or export format.

## References

- https://editor.pascal.app/docs/developers/plugins
- https://github.com/pascalorg/editor/blob/main/wiki/architecture/plugin-authoring.md
- https://github.com/pascalorg/editor/blob/main/wiki/architecture/viewer-isolation.md
