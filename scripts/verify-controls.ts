import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.env.DAYLIGHT_LAB_URL ?? 'http://127.0.0.1:5188'
const output = path.resolve(process.env.DAYLIGHT_EVIDENCE_DIR ?? 'release/controls-evidence')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal'],
})
const checks: Record<string, boolean> = {}
const errors: string[] = []
let failure: string | undefined
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    timezoneId: 'Europe/Zurich',
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await page
    .locator('.lab-toolbar [role="status"]')
    .filter({ hasText: /initialized/ })
    .waitFor({ timeout: 60000 })
  const panel = page.locator('.pascal-daylight')
  const compass = panel.getByRole('slider', { name: 'Sun direction', exact: true })
  const advanced = panel.locator('.daylight-advanced > summary')
  const jsonDetails = panel.locator('.daylight-json > summary')
  const exportPreset = async () => {
    if (!((await panel.locator('.daylight-advanced').getAttribute('open')) !== null))
      await advanced.click()
    if (!((await panel.locator('.daylight-json').getAttribute('open')) !== null))
      await jsonDetails.click()
    await panel.getByRole('button', { name: 'Export preset', exact: true }).click()
    return JSON.parse(await panel.getByLabel('Preset JSON', { exact: true }).inputValue())
  }
  assert.equal(await panel.locator('.daylight-advanced').getAttribute('open'), null)
  assert.equal(await panel.getByRole('spinbutton').count(), 0)
  await compass.press('Home')
  await compass.press('ArrowLeft')
  assert.equal(await compass.getAttribute('aria-valuenow'), '359')
  await compass.press('Shift+ArrowRight')
  assert.equal(await compass.getAttribute('aria-valuenow'), '14')
  assert.match((await compass.getAttribute('aria-valuetext')) ?? '', /North, 14 degrees/)
  const bounds = (await compass.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width - 24, bounds.y + bounds.height / 2)
  await page.mouse.down()
  assert.equal(await compass.getAttribute('aria-valuenow'), '90')
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 24, { steps: 10 })
  await page.mouse.up()
  assert.equal(await compass.getAttribute('aria-valuenow'), '0')
  checks.compassPointerKeyboardAndWrap = true
  const height = panel.getByRole('slider', { name: 'Sun height', exact: true })
  await height.press('Home')
  await panel
    .getByText('Sun is below the horizon; direct sunlight is off.', { exact: true })
    .waitFor()
  assert.equal((await exportPreset()).elevation, -90)
  const azimuth = panel.getByRole('spinbutton', { name: 'Sun azimuth (°)', exact: true })
  await azimuth.fill('75.5')
  await azimuth.press('Enter')
  assert.equal(await compass.getAttribute('aria-valuenow'), '75.5')
  await azimuth.fill('999')
  await azimuth.press('Enter')
  await panel.getByRole('alert').filter({ hasText: 'Enter a number' }).waitFor()
  assert.equal((await exportPreset()).azimuth, 75.5)
  await azimuth.fill('0')
  await azimuth.press('Enter')
  const elevation = panel.getByRole('spinbutton', { name: 'Sun elevation (°)', exact: true })
  await elevation.fill('55')
  await elevation.press('Enter')
  await advanced.click()
  const brightness = panel.getByRole('slider', { name: 'Scene brightness', exact: true })
  await brightness.press('Home')
  await brightness.press('ArrowRight')
  assert.equal((await exportPreset()).exposure, 0.15)
  await panel.getByRole('spinbutton', { name: 'Exposure', exact: true }).fill('1')
  await panel.getByRole('spinbutton', { name: 'Exposure', exact: true }).press('Enter')
  await panel.getByRole('button', { name: 'Soft fill', exact: true }).click()
  assert.equal((await exportPreset()).presentationFill, 0.08)
  await panel.getByRole('button', { name: 'Direct only', exact: true }).click()
  checks.slidersAndExactInputsShareState = true
  checks.invalidNumberIsAtomic = true
  const original = await exportPreset()
  await panel.getByLabel('Load preset file', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  })
  await panel.getByRole('alert').filter({ hasText: 'Invalid preset' }).waitFor()
  assert.deepEqual(await exportPreset(), original)
  await panel.getByLabel('Load preset file', { exact: true }).setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...original, azimuth: 35, sunPower: 4 })),
  })
  await panel.getByRole('status').filter({ hasText: 'Preset loaded' }).waitFor()
  assert.equal((await exportPreset()).azimuth, 35)
  const download = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Download preset', exact: true }).click()
  const downloaded = await download
  await downloaded.saveAs(path.join(output, 'downloaded-preset.json'))
  assert.equal(
    JSON.parse(await Bun.file(path.join(output, 'downloaded-preset.json')).text()).sunPower,
    4,
  )
  checks.presetFileRoundTripAndInvalidImport = true
  await advanced.click()
  await panel.getByRole('button', { name: 'Date & location', exact: true }).click()
  const date = panel.getByLabel('Date and time', { exact: true })
  await date.fill('2026-07-08T14:30:45')
  await date.press('Enter')
  assert.equal((await exportPreset()).instant, '2026-07-08T12:30:45.000Z')
  await date.fill('2026-03-29T02:30')
  await date.press('Enter')
  await panel.getByRole('alert').filter({ hasText: 'skipped by daylight saving' }).waitFor()
  assert.equal((await exportPreset()).instant, '2026-07-08T12:30:45.000Z')
  await date.fill('2026-10-25T02:30')
  await date.press('Enter')
  await panel.getByRole('alert').filter({ hasText: 'occurs twice' }).waitFor()
  const exactTime = panel.getByLabel('Exact time (ISO with offset)', { exact: true })
  await exactTime.fill('2026-10-25T02:30:00+01:00')
  await exactTime.press('Enter')
  await date.focus()
  await date.press('Enter')
  assert.equal((await exportPreset()).instant, '2026-10-25T02:30:00+01:00')
  checks.localTimeAndDstValidation = true
  await advanced.click()
  await date.fill('2026-07-08T14:30')
  await date.press('Enter')
  await panel.locator('h2').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'date-location-desktop.png') })
  await panel.getByRole('button', { name: 'Visual', exact: true }).click()
  await compass.press('Home')
  await panel.locator('h2').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'visual-desktop.png') })
  const overflow = async () =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth + 1 &&
        [
          ...document.querySelectorAll(
            '.pascal-daylight, .pascal-daylight input, .pascal-daylight fieldset',
          ),
        ].every((element) => element.scrollWidth <= element.clientWidth + 1),
    )
  assert.ok(await overflow())
  await page.setViewportSize({ width: 375, height: 812 })
  assert.ok(await overflow())
  await page.screenshot({ path: path.join(output, 'visual-mobile.png') })
  await panel.getByRole('button', { name: 'Date & location', exact: true }).click()
  assert.ok(await overflow())
  await advanced.click()
  await jsonDetails.click()
  assert.ok(await overflow())
  checks.narrowLayout375 = true
  await page.emulateMedia({ forcedColors: 'active' })
  await panel.getByRole('button', { name: 'Visual', exact: true }).click()
  await compass.focus()
  await page.screenshot({ path: path.join(output, 'forced-colors.png') })
  checks.forcedColorsKeyboard = true
  const touchContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  })
  const touchPage = await touchContext.newPage()
  await touchPage.goto(url)
  const touchCompass = touchPage.getByRole('slider', { name: 'Sun direction', exact: true })
  await touchCompass.scrollIntoViewIfNeeded()
  const touchBounds = (await touchCompass.boundingBox())!
  await touchPage.touchscreen.tap(
    touchBounds.x + touchBounds.width - 24,
    touchBounds.y + touchBounds.height / 2,
  )
  assert.equal(await touchCompass.getAttribute('aria-valuenow'), '90')
  checks.touchTap = true
  await touchContext.close()
  assert.deepEqual(errors, [])
  await context.close()
} catch (error) {
  failure = error instanceof Error ? error.stack : String(error)
  throw error
} finally {
  writeFileSync(
    path.join(output, 'controls-results.json'),
    `${JSON.stringify({ browser: browser.version(), checks, errors, failure, hostedCloudTested: false }, null, 2)}\n`,
  )
  await browser.close()
}
console.log(
  'PASS: beginner controls, exact inputs, files, local time, keyboard, touch and narrow layout',
)
