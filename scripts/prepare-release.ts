import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = path.resolve(import.meta.dir, '..')
function run(args: string[], cwd = root, log?: string): Buffer {
  const result = Bun.spawnSync(args, { cwd, stdout: 'pipe', stderr: 'pipe' })
  if (log) writeFileSync(log, Buffer.concat([result.stdout, result.stderr]))
  if (result.exitCode !== 0)
    throw new Error(`${args.join(' ')} failed (${result.exitCode}). ${log ?? result.stderr}`)
  return result.stdout
}
const hash = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
if (Bun.version !== pkg.packageManager.split('@')[1])
  throw new Error(`Use ${pkg.packageManager}; received Bun ${Bun.version}`)
if (run(['git', 'status', '--porcelain']).length)
  throw new Error('Commit the reviewed source first')
const commit = run(['git', 'rev-parse', 'HEAD']).toString().trim()
const tracked = run(['git', 'ls-files', '-z']).toString().split('\0').filter(Boolean)
const allowed =
  /^(src\/|test\/|lab\/|scripts\/|examples\/|docs\/|\.github\/|(?:README\.md|CHANGELOG\.md|LICENSE|NOTICE|THIRD-PARTY-NOTICES\.md|package\.json|bun\.lock|bunfig\.toml|biome\.jsonc|tsconfig(?:\.build)?\.json|vite\.config\.ts|\.gitignore)$)/
for (const file of tracked) {
  if (!allowed.test(file)) throw new Error(`Unreviewed source entry: ${file}`)
  if (!/\.(png|jpg)$/.test(file)) {
    const text = readFileSync(path.join(root, file), 'utf8')
    if (/\/Users\/[^/]+\/|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/i.test(text))
      throw new Error(`Private workspace/customer content in ${file}`)
  }
}
for (const lifecycle of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack', 'postpack'])
  if (pkg.scripts?.[lifecycle]) throw new Error(`Unexpected lifecycle hook: ${lifecycle}`)
for (const dependency of Object.keys(pkg.dependencies ?? {}))
  if (dependency !== 'suncalc') throw new Error(`Review the new runtime dependency: ${dependency}`)

const output = path.join(root, 'release', `${pkg.version}-${commit.slice(0, 12)}`)
if (existsSync(output)) throw new Error(`Immutable output already exists: ${output}`)
mkdirSync(output, { recursive: true })
const source = run(['git', 'archive', '--format=tar', '--prefix=source/', commit])
writeFileSync(path.join(output, 'source.tar.gz'), gzipSync(source, { level: 9 }))
const archiveName = `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${pkg.version}.tgz`
const receipts: Array<{ build: number; archiveSha256: string }> = []
let archive: Buffer | undefined
for (const build of [1, 2]) {
  const directory = mkdtempSync(path.join(tmpdir(), 'pascal-daylight-rebuild-'))
  run(['tar', '-xzf', path.join(output, 'source.tar.gz'), '-C', directory])
  const clean = path.join(directory, 'source')
  run(
    ['bun', 'install', '--frozen-lockfile', '--ignore-scripts'],
    clean,
    path.join(output, `install-${build}.log`),
  )
  run(['bun', 'run', 'check'], clean, path.join(output, `check-${build}.log`))
  const packed = path.join(directory, archiveName)
  run(
    ['bun', 'pm', 'pack', '--ignore-scripts', '--filename', packed],
    clean,
    path.join(output, `pack-${build}.log`),
  )
  const bytes = readFileSync(packed)
  receipts.push({ build, archiveSha256: hash(bytes) })
  if (archive && !archive.equals(bytes))
    throw new Error('Two clean builds produced different package bytes')
  archive = bytes
}
if (!archive) throw new Error('No package produced')
const artifact = path.join(output, archiveName)
writeFileSync(artifact, archive)
const members = run(['tar', '-tzf', artifact]).toString().split('\n').filter(Boolean)
for (const member of members) {
  if (
    !/^package\/(dist\/|src\/styles\.css$|docs\/(INTEGRATION|COMPATIBILITY)\.md$|README\.md$|LICENSE$|NOTICE$|THIRD-PARTY-NOTICES\.md$|package\.json$)/.test(
      member,
    )
  )
    throw new Error(`Unexpected packed entry: ${member}`)
  if (member.split('/').includes('..')) throw new Error(`Unsafe packed path: ${member}`)
}
writeFileSync(path.join(output, 'package-files.txt'), `${members.join('\n')}\n`)

const consumer = mkdtempSync(path.join(tmpdir(), 'pascal-daylight-consumer-'))
writeFileSync(
  path.join(consumer, 'package.json'),
  JSON.stringify({ private: true, type: 'module' }),
)
run(
  ['bun', 'add', '--ignore-scripts', artifact],
  consumer,
  path.join(output, 'consumer-install.log'),
)
writeFileSync(
  path.join(consumer, 'smoke.mjs'),
  `
import assert from 'node:assert/strict'
import { daylightPlugin, daylightHostPanel, daylightPresentation } from '${pkg.name}'
import { createDaylightConfiguration } from '${pkg.name}/configuration'
assert.equal(daylightPlugin.id, 'blackforestdude:daylight')
assert.equal(daylightPlugin.apiVersion, 1)
assert.equal(daylightHostPanel.defaultInstalled, false)
assert.equal(daylightPresentation.pluginId, daylightPlugin.id)
assert.equal(typeof (await daylightHostPanel.component()).default, 'function')
assert.equal(typeof (await daylightPresentation.component()).default, 'function')
const first = createDaylightConfiguration()
const second = createDaylightConfiguration()
first.update({ enabled: true, azimuth: 75 })
second.restore(JSON.parse(JSON.stringify(first.export())))
assert.deepEqual(second.export(), first.export())
console.log('PASS: archive imports, lazy entrypoints and detached preset restore')
`,
)
run(['bun', 'smoke.mjs'], consumer, path.join(output, 'consumer-smoke.log'))
writeFileSync(
  path.join(output, 'release.json'),
  `${JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      pluginId: 'blackforestdude:daylight',
      apiVersion: 1,
      sourceCommit: commit,
      sourceSha256: hash(readFileSync(path.join(output, 'source.tar.gz'))),
      archiveSha256: hash(archive),
      lockSha256: hash(readFileSync(path.join(root, 'bun.lock'))),
      bun: Bun.version,
      platform: process.platform,
      architecture: process.arch,
      license: pkg.license,
      npmPrivate: pkg.private === true,
      reproducible: true,
      builds: receipts,
      consumerSmoke: 'passed',
      hostedDeployment: 'not performed',
    },
    null,
    2,
  )}\n`,
)
const outputs = new Bun.Glob('*').scanSync({ cwd: output, onlyFiles: true })
writeFileSync(
  path.join(output, 'SHA256SUMS'),
  [...outputs]
    .sort()
    .map((file) => `${hash(readFileSync(path.join(output, file)))}  ${file}\n`)
    .join(''),
)
console.log(output)
