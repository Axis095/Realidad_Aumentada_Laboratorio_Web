import { test, expect } from '@playwright/test'
import { createARMeasurements } from '../../src/components/ar/arMeasurements.js'
import { installCamera, startAR, expectStopped } from './cameraHelpers'

test('measurements are opt-in, bounded to windows, and report CPU rather than refresh FPS', () => {
  let time = 0
  const metrics = createARMeasurements(() => time)
  expect(metrics.begin()).toBeNull()
  time = 5000
  expect(metrics.snapshot()).toBeNull()
  metrics.setEnabled(true)
  for (let frame = 0; frame < 15; frame++) {
    const start = metrics.begin()
    time += 10
    metrics.end(start, frame < 10)
  }
  time = 6000
  expect(metrics.snapshot()).toMatchObject({ trackingFps: 15, processingMeanMs: 10, processingMaxMs: 10, detectedPercent: 67, frames: 15 })
  metrics.setEnabled(false)
  const frozen = metrics.snapshot()
  time = 10000
  expect(metrics.begin()).toBeNull()
  expect(metrics.snapshot()).toEqual(frozen)
  metrics.setEnabled(true)
  expect(metrics.snapshot()).toBeNull()
  time = 11000
  expect(metrics.snapshot()).toMatchObject({ trackingFps: 0, processingMeanMs: null, detectedPercent: null })
})

const openPanel = page => page.locator('.ar-diagnostics > summary').click()
const readReport = async page => JSON.parse(await page.locator('.ar-diagnostics textarea').inputValue())

test('closed by default, opening before start stays lightweight and fits 320px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await installCamera(page)
  await page.addInitScript(() => {
    const originalSet = window.setInterval.bind(window)
    const originalClear = window.clearInterval.bind(window)
    window.__diagnosticTimers = new Set()
    window.setInterval = (callback, delay, ...args) => {
      const id = originalSet(callback, delay, ...args)
      if (delay === 1000) window.__diagnosticTimers.add(id)
      return id
    }
    window.clearInterval = id => { window.__diagnosticTimers.delete(id); originalClear(id) }
  })
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/ar/probeta')
  await expect(page.locator('.ar-diagnostics')).not.toHaveAttribute('open', '')
  const baselineTimers = await page.evaluate(() => window.__diagnosticTimers.size)
  await openPanel(page)
  await expect(page.getByRole('button', { name: 'Copiar informe de diagnóstico' })).toBeVisible()
  expect(requests.filter(url => /labARRuntime|artoolkit|\.glb/.test(url))).toEqual([])
  expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('diagnostics-320.png'), fullPage: true })
  await expect.poll(() => page.evaluate(() => window.__diagnosticTimers.size)).toBe(baselineTimers + 1)
  await openPanel(page)
  await expect.poll(() => page.evaluate(() => window.__diagnosticTimers.size)).toBe(baselineTimers)
  await openPanel(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => page.evaluate(() => window.__diagnosticTimers.size)).toBe(baselineTimers)
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(() => page.evaluate(() => window.__diagnosticTimers.size)).toBe(baselineTimers + 1)
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__diagnosticTimers.size)).toBe(baselineTimers)
})

test('live tracker reports metrics, copies a snapshot and preserves it after closing camera', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await installCamera(page)
  await page.addInitScript(() => {
    localStorage.setItem('labvirtual-visual-quality', 'reduced')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedDiagnostic = text } } })
  })
  await page.goto('/ar/beaker')
  await openPanel(page)
  await startAR(page)
  await expect(page.getByTestId('diagnostic-fps')).toHaveText(/\d+(\.\d+)? \/ 15 FPS/)
  await page.getByLabel('Teléfono probado (opcional)').fill('Galaxy A04 de prueba')
  await page.getByRole('button', { name: 'Copiar informe de diagnóstico' }).click()
  const report = await readReport(page)
  expect(report.device).toBe('Galaxy A04 de prueba')
  expect(report.instrument.id).toBe('beaker')
  expect(report.runtime).toMatchObject({ profile: 'reduced', running: true, trackingResolution: '480 × 360' })
  expect(report.runtime.modelLoadMs).toBeGreaterThanOrEqual(0)
  expect(report.runtime.modelBytes).toBeGreaterThan(20)
  expect(report.runtime.tracking.frames).toBeGreaterThan(0)
  expect(report.runtime.tracking.processingMeanMs).toBeGreaterThanOrEqual(0)
  expect(JSON.parse(await page.evaluate(() => window.__copiedDiagnostic))).toEqual(report)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('diagnostics-live-320.png'), fullPage: true })
  await page.getByRole('button', { name: 'Cerrar experiencia y apagar cámara' }).click()
  await expectStopped(page)
  await expect(page.locator('.ar-diagnostics')).toContainText('Detenido · última muestra')
  await page.getByRole('button', { name: 'Copiar informe de diagnóstico' }).click()
  const stopped = await readReport(page)
  expect(stopped.runtime.running).toBe(false)
  expect(stopped.runtime.modelBytes).toBe(report.runtime.modelBytes)
  // A new instrument must not inherit the previous measurements or personal note.
  await page.getByLabel('Selecciona un instrumento').selectOption('probeta')
  await openPanel(page)
  await page.getByRole('button', { name: 'Copiar informe de diagnóstico' }).click()
  expect((await readReport(page)).runtime).toBeNull()
  expect((await readReport(page)).device).toBe('No indicado')
})

test('preview is demand-driven and copying has a manual fallback', async ({ page }) => {
  await installCamera(page, { denied: true })
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async () => { throw new Error('Denied') } },
  }))
  await page.goto('/ar/beaker')
  await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
  await openPanel(page)
  await expect(page.getByTestId('diagnostic-fps')).toHaveText('Bajo demanda · sin FPS continuo')
  await page.getByRole('button', { name: 'Copiar informe de diagnóstico' }).click()
  await expect(page.locator('.ar-diagnostics')).toContainText('No se pudo copiar automáticamente')
  expect((await readReport(page)).runtime.tracking).toBeNull()
  expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
})

test('permission failure is included in the report without starting a renderer', async ({ page }) => {
  await installCamera(page, { denied: true })
  await page.goto('/ar/beaker')
  await openPanel(page)
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Copiar informe de diagnóstico' }).click()
  expect((await readReport(page)).error).toContain('No se autorizó la cámara')
  expect((await readReport(page)).runtime.running).toBe(false)
  await expect(page.locator('.ar-demo-runtime canvas, .ar-demo-runtime video')).toHaveCount(0)
})
