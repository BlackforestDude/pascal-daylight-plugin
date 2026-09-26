# Compatibility and review boundaries

Plugin API: 1. Development and peer qualification: Pascal core/editor/viewer 1.0.3,
Three 0.186.0. Exact resolved development dependencies are pinned in `bun.lock`.
Peer ranges are deliberately narrow for this first external review. Broaden them after testing.

The plugin uses only public Pascal exports. Its manifest has no semantic nodes; the editor
panel and viewer presentation are separate lazy exports. The lab alone imports host source
to exercise actual ceiling and block rendering.

Host review baseline: `pascalorg/editor` commit
`3f303174fff4bf0b53a784a217a6f2295b033889` (26 September 2026).
The companion patch is reviewed separately because the stock host's shadow attenuation,
unlit ceiling undersides and glazing shadow handling affect enclosure checks independently
of the Daylight plugin. Installing the plugin must not secretly patch these host internals.

The companion change makes opaque shadows fully occlude direct light, lights the ceiling
underside, and preserves transparent glazing versus opaque-frame shadows while paint changes.
It preserves a single editable semantic block while splitting its render draws by used slot.
The latter can increase draw calls; measured synthetic checks do not establish performance
for arbitrary large customer scenes. It is an explicit host-review tradeoff.

No certification is claimed for Pascal's deployed cloud revision, Safari, Firefox, mobile GPUs,
indirect illumination, calibrated photometry, or arbitrary versions outside the pinned matrix.
Review evidence must identify both the plugin archive and host patch hashes.
