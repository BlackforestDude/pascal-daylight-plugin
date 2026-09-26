# Pascal Daylight

An independent, opt-in sun and lighting-preset plugin for Pascal Plugin API v1.
Publisher candidate: [BlackforestDude](https://github.com/BlackforestDude).
This is a submission candidate, not an official Pascal product or hosted-catalog listing.

## Capabilities

- Manual compass angles or offline date/location calculations using SunCalc 2.0.2.
- Direct sunlight, exposure, and separately labelled unoccluded presentation fill.
- Strict version-1 JSON preset validation, export and import.
- Per-viewer atmosphere ownership, competing-atmosphere detection, and cleanup on uninstall.
- Warnings for incompatible display settings without modifying the model or host preferences.

This is raster sunlight. It does not simulate bounced light, photometric lux, coloured
transmission or caustics. A roofless scene is a presentation view, not an enclosed-room test.

## Use in a project

A Pascal host must bundle the package first. Open **Plugins → Daylight → Install**,
then enable Daylight in its panel. Disable any competing atmosphere through its own panel.
Uninstalling Daylight releases its presentation; it does not delete or rewrite authored nodes.

For enclosure checks use shadows on, Rendered shading, full-height walls, stacked levels,
visible roof/ceiling and zero presentation fill. Fast preview bypasses post-processing.

See [host integration](docs/INTEGRATION.md) for bootstrap, saved settings and public-viewer
requirements. [Compatibility](docs/COMPATIBILITY.md) separates the plugin API from the
companion rendering fixes. No ZIP or npm upload installs a plugin into Pascal's official cloud.

## Reproduce

Use Bun 1.3.13, Git and tar. No install-time scripts are required.

```sh
bun install --frozen-lockfile --ignore-scripts
bun run check
bun run release
```

The release command requires a clean Git commit. It exports that source, performs two isolated
clean installs/checks/builds, packs both, and fails if the package bytes differ. It also installs
the resulting archive into a clean consumer, checks the exported API and writes checksums,
source revision, file inventory and command logs under `release/`. It never publishes.
See [release procedure](docs/RELEASING.md).

## Visual verification

The synthetic 3 × 4 m room contains no customer files or downloaded models. Its optional
test harness reads the explicitly selected Pascal source checkout; production plugin code
imports only public packages.

```sh
PASCAL_EDITOR_ROOT=/absolute/path/to/reviewed/pascal-editor bun run dev:lab
```

Run enclosure, native-glazing and lifecycle checks in the lab. Repeat with `?backend=webgl`.
Do not interpret geometry/texture counters as a complete GPU-memory measurement.
The browser harness also compares Three's complete reported GPU allocation counters after
20 warm remounts. [Testing instructions](docs/TESTING.md) cover both renderer backends and
the integrated editor. See the review packet's verification report for observed results
and remaining host acceptance.

## Data and external services

Runtime network requests, accounts, API keys, telemetry, geolocation requests, cookies and
plugin-owned local storage: none. Coordinates and timestamps are manually supplied settings.
Hosts choose where to persist the versioned preset; the stock local host uses browser storage.
Shared viewers need host-owned project persistence and the same display preferences.
GitHub publisher/documentation links are opened only when a user follows them.

## Identity and distribution

Plugin ID: `blackforestdude:daylight`. The earlier private candidate used `local:daylight`;
enable the new ID explicitly. Version-1 exported presets remain importable. No automatic
scene migration or public namespace registration is claimed.

Licensed under [Apache 2.0](LICENSE), with attribution in [NOTICE](NOTICE).
The package keeps `private: true` solely to prevent accidental npm publication; its release
archive is installable by a reviewed host. GitHub distribution does not require npm publication.
Support before publication: the publisher's submission discussion. A repository issue URL
must be added when the repository exists. Third-party terms are in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
