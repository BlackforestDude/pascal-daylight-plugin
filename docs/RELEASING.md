# Reproducible review release

1. Select and record publisher identity and licence. Add a real repository/support URL after
   creation; do not present a proposed URL as live. Keep npm publication disabled until the
   namespace and publishing account are confirmed. A GitHub release tarball is sufficient for
   host review and installation without npm publication.
2. Run `bun install --frozen-lockfile --ignore-scripts` and `bun run check`.
3. Commit the complete public source. Run `bun run release` from that clean commit.
4. Review the generated checksums, file list, clean-build logs and consumer import receipt.
   Never edit an already distributed artifact; version and rebuild any change.
5. Add the separately verified host patch, its baseline, visual evidence and submission text.
   No customer projects, offers, models, databases or private audit documents belong in the bundle.
6. After publication is explicitly authorized, create the repository and publish the pinned
   release assets. Open a Pascal discussion using the prepared submission text. An integration
   PR and deployment remain Pascal's review decisions.

`bun run release` produces a source archive, an installable npm-format archive, SHA256SUMS,
release metadata, a packed-file inventory and verification logs. It repeats install/check/build
in two independent temporary source directories and compares the complete package bytes.
It refuses a dirty checkout and install hooks. It has no network write or publishing command.

The source archive can rebuild the package without the author's workspace. Git is needed
only for exporting the original clean source; the two isolated builds use the exported files.
The optional native-rendering lab additionally needs the pinned host and companion patch.
