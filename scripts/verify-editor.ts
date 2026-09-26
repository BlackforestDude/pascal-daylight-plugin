import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.env.DAYLIGHT_EDITOR_URL ?? 'http://127.0.0.1:5290'
if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
  throw new Error('Use an isolated local review host, never a customer or cloud project')
const output = path.resolve(process.env.DAYLIGHT_EVIDENCE_DIR ?? 'release/editor-evidence')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal'],
})
const errors: string[] = []
const warnings = new Set<string>()
const externalOrigins = new Set<string>()
const checks: Record<string, boolean> = {}
let failure: string | undefined
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.add(message.text())
  })
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(url).origin)
      externalOrigins.add(new URL(request.url()).origin)
  })
  await page.goto(url)
  await page.getByRole('button', { name: 'Plugins', exact: true }).click({ timeout: 60000 })
  await page.getByRole('button', { name: /^Daylight Not installed/ }).click()
  await page.getByText('blackforestdude:daylight', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(output, 'plugin-listing.png') })
  checks.optInByDefault = true
  await page.getByRole('button', { name: 'Install', exact: true }).click()
  await page.getByRole('button', { name: 'Daylight', exact: true }).click()
  const enabled = page.getByRole('checkbox', { name: 'Enable daylight', exact: true })
  await enabled.waitFor()
  assert.equal(await enabled.isChecked(), false)
  await enabled.check()
  const compass = page.getByRole('slider', { name: 'Sun direction', exact: true })
  await compass.press('Home')
  await compass.press('Shift+ArrowRight')
  assert.equal(await compass.getAttribute('aria-valuenow'), '15')
  const advanced = page.locator('.daylight-advanced > summary')
  const jsonDetails = page.locator('.daylight-json > summary')
  await advanced.click()
  const azimuth = page.getByRole('spinbutton', { name: 'Sun azimuth (°)', exact: true })
  await azimuth.fill('75')
  await azimuth.press('Enter')
  await jsonDetails.click()
  await page.getByRole('button', { name: 'Export preset', exact: true }).click()
  const preset = await page.locator('.pascal-daylight textarea').inputValue()
  assert.equal(JSON.parse(preset).azimuth, 75)
  assert.equal(JSON.parse(preset).enabled, true)
  checks.installEnableAndEdit = true
  checks.visualCompassAndExactInput = true
  await advanced.click()
  await page.locator('.pascal-daylight h2').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'controls.png') })
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await page.locator('.pascal-daylight').waitFor({ state: 'hidden' })
  await page.screenshot({ path: path.join(output, 'preview.png') })
  checks.previewTransition = true
  await page.reload()
  await page.getByRole('button', { name: 'Daylight', exact: true }).click({ timeout: 60000 })
  await enabled.waitFor()
  assert.equal(await enabled.isChecked(), true)
  assert.equal(await compass.getAttribute('aria-valuenow'), '75')
  await advanced.click()
  assert.equal(await azimuth.inputValue(), '75')
  await jsonDetails.click()
  checks.localPresetSurvivesReload = true
  await page.getByRole('button', { name: 'Export preset', exact: true }).click()
  assert.equal(await page.locator('.pascal-daylight textarea').inputValue(), preset)
  await page.getByRole('button', { name: 'Plugins', exact: true }).click()
  await page.getByRole('button', { name: /^Daylight Installed/ }).click()
  await page.getByRole('button', { name: 'Uninstall', exact: true }).click()
  await page.getByRole('button', { name: 'Daylight', exact: true }).waitFor({ state: 'hidden' })
  await page.getByText('Not installed', { exact: true }).waitFor()
  checks.uninstallRemovesPanel = true
  await page.screenshot({ path: path.join(output, 'uninstalled.png') })
  assert.deepEqual(errors, [], 'Integrated editor browser errors')
  await context.close()
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  writeFileSync(
    path.join(output, 'editor-results.json'),
    `${JSON.stringify({ browser: browser.version(), checks, errors, warnings: [...warnings], externalOrigins: [...externalOrigins], failure, hostedCloudTested: false }, null, 2)}\n`,
  )
  await browser.close()
}
console.log('PASS: opt-in installation, preset edit/reload, preview transition and uninstall')
