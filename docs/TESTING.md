# Repeat the review checks

Use Bun 1.3.13. The source archive includes the lockfile and test harnesses. It contains no
installed dependencies, customer scenes or credentials. Installs need access to public package
registries. All commands below are local and do not publish.

## Package from the exported source

```sh
tar -xzf source.tar.gz
cd source
bun install --frozen-lockfile --ignore-scripts
bun run check
bun pm pack --ignore-scripts --filename pascal-daylight-plugin-0.1.0.tgz
shasum -a 256 pascal-daylight-plugin-0.1.0.tgz
```

Compare the final hash with `release.json` attached to the same release. On Linux, `sha256sum` is
equivalent. In the original clean Git checkout, `bun run release` automates two independent
rebuilds, byte comparison, allowlist checks and a clean-consumer import smoke test.

## Native rendering lab

Apply the review packet's host patches in their documented order to its pinned Pascal baseline.
The preserved rc.6 host patch bundles rc.6; to integrate 0.1.0, replace that dependency with the
0.1.0 archive from the stable release and regenerate the host lockfile before testing.
Install that host with its lockfile. From this plugin's source, start:

```sh
PASCAL_EDITOR_ROOT=/absolute/path/to/reviewed/pascal-editor bun run dev:lab
```

The lab listens on `http://127.0.0.1:5188`. In another terminal, run:

```sh
bun scripts/verify-controls.ts
bun scripts/verify-browser.ts
```

This script requires an installed Google Chrome and the package's pinned Playwright dependency.
It opens an isolated headless profile. Its GPU arguments target the tested macOS Metal setup;
choose the appropriate native GPU configuration when qualifying another operating system.
Do not report a WebGPU result unless the rendered status identifies WebGPU.

The controls script verifies pointer/keyboard compass movement, slider/manual agreement,
atomic invalid edits, preset file round trips, Europe/Zurich time-zone and clock-change
validation, a 375 px viewport, touch tapping and forced-colour keyboard controls. It records
screenshots and console errors. This is targeted accessibility coverage, not a WCAG audit.

The rendering script verifies closed-roof and window occlusion, native mixed glass/frame slots, opaque
paint/restore, 20 warm remounts, competing atmospheres, atomic invalid-preset rejection and no
horizontal overflow at a 375 px viewport. It records screenshots, measured frames, full
Three-reported GPU counters, console errors/warnings and network requests. These counters are
not an operating-system GPU profiler. They do not prove unlimited-duration leak freedom.

Override the endpoint with `DAYLIGHT_LAB_URL` and output folder with `DAYLIGHT_EVIDENCE_DIR`.
The lab imports host source to test its real materials; the published runtime does not.

## Integrated editor

Build the reviewed host and explicitly typecheck it; Next's build configuration skips TypeScript
errors. Use a disposable local database and a separate port, never a customer's running server:

```sh
bunx turbo run build --filter=editor --concurrency=1
bun run --cwd apps/editor check-types
PASCAL_DB_PATH=/absolute/path/to/disposable-review.db PORT=5290 bun run --cwd apps/editor start
```

From the plugin source in another terminal:

```sh
bun scripts/verify-editor.ts
```

The script uses only a fresh browser's blank canvas. It verifies the plugin is initially opt-in,
installs it through Plugins, enables it, changes/exports a preset, enters preview, reloads and
checks local persistence, then uninstalls it. It records any external origins requested by the
whole host; these may include built-in icon services. `DAYLIGHT_EDITOR_URL` accepts localhost
only. Use `DAYLIGHT_EVIDENCE_DIR` to preserve each run separately.

Cloud publication, fresh-visitor public-viewer persistence, multiple project revisions and the
host's snapshot/export pipeline require separate acceptance in Pascal's own application.
