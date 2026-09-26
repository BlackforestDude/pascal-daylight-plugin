import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.env.DAYLIGHT_LAB_URL ?? 'http://127.0.0.1:5188'
const output = path.resolve(process.env.DAYLIGHT_EVIDENCE_DIR ?? 'release/browser-evidence')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal'],
})
const receipts: unknown[] = []
try {
  for (const backend of ['webgpu', 'webgl']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const errors: string[] = []
    const warnings = new Set<string>()
    const externalRequests = new Set<string>()
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
      if (message.type() === 'warning') warnings.add(message.text())
    })
    page.on('request', (request) => {
      if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(url).origin)
        externalRequests.add(request.url())
    })
    const checks: Record<string, unknown> = {}
    await page.goto(`${url}/?backend=${backend}`)
    const status = page.locator('.lab-toolbar [role="status"]')
    await status.filter({ hasText: /initialized/ }).waitFor({ timeout: 60000 })
    const initialized = await status.innerText()
    assert.equal(initialized.startsWith('WebGPU'), backend === 'webgpu', initialized)
    for (const [name, button, passText, sampleKeys] of [
      [
        'enclosure',
        'Run enclosure checks',
        'PASS: roof and window',
        ['sealed', 'window', 'roof-removed'],
      ],
      [
        'glazing',
        'Run native glazing checks',
        'PASS: native block glass',
        ['open-aperture', 'glass-only', 'glass-and-frame', 'repainted-opaque', 'glass-restored'],
      ],
      [
        'lifecycle',
        'Stress GPU lifecycle',
        'PASS: stable geometry',
        ['stress-before', 'stress-after'],
      ],
    ] as const) {
      await page.getByRole('button', { name: button, exact: true }).click()
      await status
        .filter({ hasText: new RegExp(`^(${passText}|FAIL:|Error:)`) })
        .waitFor({ timeout: 120000 })
      const verdict = await status.innerText()
      const samples = JSON.parse(await page.locator('.lab-results').innerText())
      assert.deepEqual(Object.keys(samples), [...sampleKeys], 'Stale results from another check')
      checks[name!] = { verdict, samples }
      writeFileSync(
        path.join(output, `${backend}-checks.json`),
        `${JSON.stringify(checks, null, 2)}\n`,
      )
      await page.screenshot({ path: path.join(output, `${backend}-${name}.png`), fullPage: true })
      assert.ok(verdict.startsWith('PASS:'), verdict)
      if (name === 'lifecycle')
        assert.deepEqual(
          samples['stress-after'].gpuMemory,
          samples['stress-before'].gpuMemory,
          'GPU allocations grew after warm remounts',
        )
      if (name !== 'lifecycle') {
        const download = page.waitForEvent('download')
        await page.getByRole('button', { name: 'Download measured frames', exact: true }).click()
        await (await download).saveAs(path.join(output, `${backend}-${name}-measured.png`))
      }
    }
    await page.getByRole('checkbox', { name: 'Other atmosphere', exact: true }).check()
    await page
      .getByText('At least one open view is owned by another atmosphere.', { exact: false })
      .waitFor()
    await page.getByRole('checkbox', { name: 'Other atmosphere', exact: true }).uncheck()
    await page.locator('.daylight-advanced > summary').click()
    await page.locator('.daylight-json > summary').click()
    await page.getByRole('button', { name: 'Export preset', exact: true }).click()
    const presetInput = page.locator('.pascal-daylight textarea')
    const preset = await presetInput.inputValue()
    await presetInput.fill('{"version":999}')
    await page.getByRole('button', { name: 'Load preset', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'Invalid preset' }).waitFor()
    await page.getByRole('button', { name: 'Export preset', exact: true }).click()
    assert.equal(await presetInput.inputValue(), preset)
    await page.setViewportSize({ width: 375, height: 812 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await page.screenshot({ path: path.join(output, `${backend}-mobile.png`), fullPage: true })
    receipts.push({
      backend,
      browser: browser.version(),
      initialized,
      checks,
      errors,
      warnings: [...warnings],
      externalRequests: [...externalRequests],
      invalidImportAtomic: true,
      competingAtmosphere: true,
      responsiveWidth375: true,
    })
    writeFileSync(
      path.join(output, 'browser-results.json'),
      `${JSON.stringify(receipts, null, 2)}\n`,
    )
    assert.deepEqual(errors, [], `${backend} browser errors`)
    assert.deepEqual([...externalRequests], [], 'Unexpected external requests')
    await context.close()
  }
} finally {
  await browser.close()
}
console.log(`PASS: both backends; evidence in ${output}`)
