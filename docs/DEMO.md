# Release introduction and demonstration

## Watch the intro

https://github.com/user-attachments/assets/071dc4f3-244d-4680-b70d-66ae886febb0

The 32-second launch film plays directly on GitHub, with animated headlines, enlarged control
views, music and room details. It records real local-editor output and actual Daylight controls.
The summer/winter comparison uses still frames from the matched recording. Camera framing,
cuts, text, contrast overlays and a cursor highlight are presentation edits; lighting is rendered
by Pascal. No rendered light or shadow is added in post-production.

The browser copy is 1920 × 1080 at 30 fps, H.264 with AAC audio, optimized for inline playback.
The [original silent demo](https://github.com/BlackforestDude/pascal-daylight-plugin/releases/download/v0.1.0/Daylight-demo.mp4)
remains available as a separate release attachment.

## Recorded versions

- Plugin: `0.1.0-rc.6`, source `0e020a9fb4a4f3da2c311367e0bc9d4d55f9a509`.
- Local host: `0684bc601ad4f7f7eec181fc3a4ab5098c8dda2d`.
- Separate host shadow companion: `e2249215aaa13c63a929a03c0e8fefdadd484ec4`.
- Chrome 153 on macOS, WebGPU/Metal, production host build.
- Rendered shading, shadows on, full-height walls, stacked levels, textures on.

Version 0.1.0 preserves the recorded rc.6 runtime code and styles. The launch film has a 0.1.0
end card. The original silent video retains its recording-time release-candidate end card.

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
Only the computed sun position changes. The launch film's new living-room compass recording
uses sun strength 3, sun height 24°, exposure 1.8 and 22% presentation fill. The original silent
demo's living-room detail uses 20% presentation fill.

This is a visual demonstration of a local review host. It does not certify lux, energy use,
weather, indirect illumination, a building's real-world daylight performance, hosted Pascal
integration or arbitrary GPU/browser support. See [compatibility](COMPATIBILITY.md).

Text overlays are editorial labels, not a transcript. The editable Tesseract projects are
retained separately from the code release; no customer scene source is needed to watch.

## Music

“Beauty Flow” by Kevin MacLeod ([incompetech.com](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1900008)),
licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
The launch film uses an edited excerpt, normalized and faded, with locally synthesized
transition sounds. The music licence is separate from the plugin's Apache 2.0 licence.
