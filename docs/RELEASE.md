# Daylight 0.1.0-rc.6 — visual sun controls for Pascal

Daylight is a small, offline plugin for exploring where direct sunlight lands in a Pascal scene.
Drag the sun around a compass, adjust its height and strength, or calculate its position from
a date and location. Export a preset when you want to reuse the settings.

This first public candidate is for community feedback and Pascal's host-integration review.
It is an independent Apache-2.0 project, not an official hosted Pascal plugin listing.

## Try the workflow

The attached **Daylight-demo.mp4** shows the actual controls in a local integrated editor,
with bathroom and living-room footage from an existing apartment. It demonstrates visual
sun placement, direct light versus presentation fill, summer/winter angles, and preset download.

A host must bundle the package and stylesheet first. Users of that host then open
**Plugins → Daylight → Install** and enable it in the Daylight panel. The review packet includes
integration instructions and the separate host shadow patches. Uploading this ZIP does not
install code in Pascal's official cloud editor.

## Included

- Visual compass with pointer, touch and keyboard controls.
- Sliders for sun height, sunlight strength, exposure and clearly labelled artistic fill.
- Offline date/location sun-position calculations using SunCalc.
- Exact controls, versioned JSON and preset-file import/export.
- Opt-in lifecycle and competing-atmosphere detection.
- Reproducible source/package, Apache-2.0 notices and bounded verification evidence.

Sun position is astronomical; brightness is manual. Direct light switches off below the
horizon. This release does not model weather, bounced light, calibrated lux or coloured glass.

## Verification and provenance

The release tag identifies plugin source **0e020a9fb4a4f3da2c311367e0bc9d4d55f9a509**.
Two clean builds produced byte-identical package archives. Each passed formatting, types,
22 plugin tests (zero skipped), build and a clean consumer check. Local editor controls and
synthetic WebGPU/WebGL enclosure/glazing/lifecycle checks passed. Detailed limits and retained
prior host-suite evidence are in **VERIFICATION.md** inside the review packet.

Package SHA-256:
`c75e0ed1ae0e0e8abff57a826ffed8d222b9ffc50cf9acda1fcbbd41373cd187`

Original review ZIP SHA-256:
`c57ed4eec1a3f5ae8d0a9801587c7c2913b9ffece1cbcb76ae7dc7f44e4c096b`

The original packet is preserved as prepared; its statement that external publication had not
occurred describes that preparation checkpoint. This GitHub release is the later distribution
step. The demo and repository presentation are newer; the packaged plugin has not been changed.

Pascal's review/bundling, hosted project persistence and fresh-visitor public-viewer acceptance
remain required. No npm publication or official cloud deployment is part of this release.

[Integration guide](https://github.com/BlackforestDude/pascal-daylight-plugin/blob/main/docs/INTEGRATION.md) ·
[Demo settings](https://github.com/BlackforestDude/pascal-daylight-plugin/blob/main/docs/DEMO.md) ·
[Feedback and bugs](https://github.com/BlackforestDude/pascal-daylight-plugin/issues)
