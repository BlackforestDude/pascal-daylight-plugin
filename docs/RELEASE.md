# Daylight 0.1.0 — visual sun controls for Pascal

Daylight is a small, offline plugin for exploring where direct sunlight lands in a Pascal scene.
Drag the sun around a compass, adjust its height and strength, or calculate its position from
a date and location. Export a preset when you want to reuse the settings.

This is the first stable GitHub release of the independent Apache-2.0 plugin. It retains the
tested rc.6 runtime, controls, styles and dependencies; only version metadata and documentation
change. Pascal's official cloud integration is a separate host decision.

## Use it

Download **pascal-daylight-plugin-0.1.0.tgz** and follow the
[host integration guide](https://github.com/BlackforestDude/pascal-daylight-plugin/blob/v0.1.0/docs/INTEGRATION.md).
A Pascal host must bundle the package and stylesheet. Users then open
**Plugins → Daylight → Install** and enable it in the Daylight panel.

The attached **Daylight-demo.mp4** shows actual controls, bathroom window shadows, light balance,
summer/winter sun positions and preset download in an integrated local editor. It was recorded
with rc.6, whose runtime is unchanged in 0.1.0; the original video end card retains that label.

## Included

- Visual sun compass with pointer, touch and keyboard controls.
- Sliders for sun height, sunlight strength, exposure and clearly labelled artistic fill.
- Offline date/location sun-position calculations using SunCalc.
- Exact controls, versioned JSON and preset-file import/export.
- Opt-in lifecycle and competing-atmosphere detection.
- Reproducible source/package and Apache-2.0 notices.

Sun position is astronomical; brightness is manual. Direct light switches off below the
horizon. This release does not model weather, bounced light, calibrated lux or coloured glass.

## Reproduce and verify

The **v0.1.0** tag identifies the source. **release.json** records its commit, toolchain,
archive hash, clean-build results and consumer import check. **source.tar.gz** contains the
complete exported source; **SHA256SUMS** covers the attached artifacts.

The release procedure runs formatting, types, all 22 plugin tests, build and package checks
in two independent clean directories, then compares the complete package bytes. It also
installs the result into a clean consumer and verifies the exported API and preset restore.

The original **daylight-pascal-review-0.1.0-rc.6.zip** is preserved as historical host-integration
and browser evidence. It contains rc.6, the separately tested Pascal shadow patches and their
verification limits. Use the separate **0.1.0** package for new integrations. Earlier source
and browser evidence is not relabelled as a new 0.1.0 browser run.

Pascal's official hosted integration, project persistence and fresh-visitor public-viewer
acceptance remain pending. Publishing this GitHub release does not install the plugin in
Pascal's cloud editor. No npm publication is part of this release.

[Demo settings](https://github.com/BlackforestDude/pascal-daylight-plugin/blob/v0.1.0/docs/DEMO.md) ·
[Feedback and bugs](https://github.com/BlackforestDude/pascal-daylight-plugin/issues)
