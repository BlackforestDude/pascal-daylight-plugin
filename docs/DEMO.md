# Release demonstration

[Watch or download the MP4](https://github.com/BlackforestDude/pascal-daylight-plugin/releases/download/v0.1.0-rc.6/Daylight-demo.mp4).

The silent, captioned video records real local-editor output and actual Daylight controls.
It includes an existing apartment's bathroom and living-room details. Camera framing, cuts,
captions and a cursor highlight are presentation edits; lighting is rendered by Pascal.
No rendered light or shadow is added in post-production.

## Recorded versions

- Plugin: `0.1.0-rc.6`, source `0e020a9fb4a4f3da2c311367e0bc9d4d55f9a509`.
- Local host: `0684bc601ad4f7f7eec181fc3a4ab5098c8dda2d`.
- Separate host shadow companion: `e2249215aaa13c63a929a03c0e8fefdadd484ec4`.
- Chrome 153 on macOS, WebGPU/Metal, production host build.
- Rendered shading, shadows on, full-height walls, stacked levels, textures on.

A private copy of the apartment was used. Its presentation names were made generic and its
room/spawn helpers hidden for filming. The original project was not edited. The graph and
underlying third-party models are not distributed here.

## What the demonstration means

The compass and height slider move a directional sun. The bathroom's visible shadow changes
come from its window, walls and fixtures. Direct-only removes presentation fill. Raising
**Lift dark areas** adds unoccluded artistic fill; it does not calculate bounced daylight.

The seasonal comparison uses example coordinates 47.4° N, 8.5° E, the device time zone
Europe/Zurich, 21 June 2026 at 13:30 and 21 December 2026 at 12:30. Model north is rotated 180°
for this demonstration; that is an illustrative alignment, not a surveyed building orientation.
Sun power (3), exposure (1.6) and presentation fill (0.18) stay constant across the two dates.
Only the computed sun position changes. The living-room detail uses 20% presentation fill.

This is a visual demonstration of a local review host. It does not certify lux, energy use,
weather, indirect illumination, a building's real-world daylight performance, hosted Pascal
integration or arbitrary GPU/browser support. See [compatibility](COMPATIBILITY.md).

The video is intentionally silent so it works as a documentation demo. Captions are editorial
labels, not a transcript. Its editable Tesseract project is retained separately from the code
release; no customer scene source is needed to watch the video.
