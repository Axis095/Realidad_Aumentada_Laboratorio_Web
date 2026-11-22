import { test, expect } from '@playwright/test'
import { createProcessMeasurements } from '../../src/components/canvas/processMeasurements.js'

test('collector counts only active measured renders and excludes pause time', () => {
  let time = 0
  const measurements = createProcessMeasurements(() => time)
  measurements.setPlaying(true)
  expect(measurements.begin()).toBeNull()
  measurements.setEnabled(true)
  for (let index = 0; index < 20; index++) {
    const start = measurements.begin()
    time += 2
    measurements.end(start)
    time += 48
  }
  expect(measurements.snapshot()).toMatchObject({ renderedFps: 20, renderCpuMeanMs: 2, renderCpuMaxMs: 2, frames: 20, windowMs: 1000 })
  measurements.setPlaying(false)
  const paused = measurements.snapshot()
  time += 90000
  expect(measurements.begin()).toBeNull()
  expect(measurements.snapshot()).toEqual(paused)
  measurements.setPlaying(true)
  expect(measurements.snapshot()).toBeNull()
  measurements.setEnabled(false)
  expect(measurements.begin()).toBeNull()
  measurements.reset()
  expect(measurements.snapshot()).toBeNull()
})

const diagnostic = page => page.locator('.process-diagnostics')
const toggle = page => diagnostic(page).locator('summary').click()
const copy = async page => {
  await diagnostic(page).getByRole('button', { name: /Copiar resultado|Copiar informe de error/ }).click()
  return JSON.parse(await diagnostic(page).locator('textarea').inputValue())
}
async function expectNoResult(page) {
  await expect(diagnostic(page).getByRole('button', { name: 'Copiar resultado' })).toBeDisabled()
  await expect(diagnostic(page).locator('textarea')).toHaveCount(0)
  await expect(page.locator('#process-test-guidance')).toContainText(/Sin medición|Preparando|Midiendo/)
}
async function setup(page) {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem('labvirtual-visual-quality', 'reduced')
    window.__copiedProcess = null
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedProcess = value } } })
    const set = window.setInterval.bind(window), clear = window.clearInterval.bind(window)
    window.__diagnosticIntervals = new Set()
    window.setInterval = (fn, delay, ...args) => {
      const id = set(fn, delay, ...args)
      if (delay === 1000) window.__diagnosticIntervals.add(id)
      return id
    }
    window.clearInterval = id => { window.__diagnosticIntervals.delete(id); clear(id) }
    window.__diagnosticDraws = 0
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!type) continue
      for (const name of ['drawArrays', 'drawElements']) {
        const original = type.prototype[name]
        type.prototype[name] = function (...args) { window.__diagnosticDraws++; return original.apply(this, args) }
      }
    }
  })
  await page.goto('/modulo/2')
}
async function open3D(page) {
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
}

test('opt-in panel creates no 3D requests and stops polling on close, hidden and unmount', async ({ page }) => {
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await setup(page)
  await expect(diagnostic(page)).not.toHaveAttribute('open', '')
  const baseline = await page.evaluate(() => window.__diagnosticIntervals.size)
  await toggle(page)
  await expect.poll(() => page.evaluate(() => window.__diagnosticIntervals.size)).toBe(baseline + 1)
  await expectNoResult(page)
  expect(await page.evaluate(() => window.__copiedProcess)).toBeNull()
  expect(requests.some(url => /processPrototypeRuntime|artoolkit|\.glb/.test(url))).toBe(false)
  await expect(page.locator('.process-prototype canvas')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await toggle(page)
  await expect.poll(() => page.evaluate(() => window.__diagnosticIntervals.size)).toBe(baseline)
  await toggle(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => page.evaluate(() => window.__diagnosticIntervals.size)).toBe(baseline)
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(() => page.evaluate(() => window.__diagnosticIntervals.size)).toBe(baseline + 1)
  await page.getByRole('link', { name: /Siguiente módulo/ }).click()
  await expect.poll(() => page.evaluate(() => window.__diagnosticIntervals.size)).toBe(baseline)
})

test('each scene reports actual renders; pause freezes data without drawing and closing retains the report', async ({ page }, testInfo) => {
  await setup(page)
  await toggle(page)
  await open3D(page)
  await page.getByLabel('Teléfono probado (opcional)').fill('Galaxy A04 de prueba')
  for (const [title, id] of [['Llenado', 'fill'], ['Vertido', 'pour'], ['Agitación', 'stir']]) {
    await page.getByRole('button', { name: new RegExp(title) }).click()
    await expectNoResult(page)
    await expect(diagnostic(page).locator('dd').first()).toHaveText(`${title} / 0 %`)
    await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
    await expect(page.getByTestId('process-diagnostic-fps')).toHaveText(/\d+(\.\d+)? \/ 20 FPS/)
    await page.getByRole('button', { name: 'Pausar', exact: true }).click()
    const first = await copy(page)
    expect(first.experience).toBe('module-2-process')
    expect(first.resultType).toBe('measurement')
    expect(first.diagnosticVersion).toBe(2)
    expect(first.device).toBe('Galaxy A04 de prueba')
    expect(first.runtime).toMatchObject({ sceneId: id, state: 'paused', running: true, profile: 'reduced', targetFps: 20 })
    expect(first.runtime.measurement.frames).toBeGreaterThan(0)
    expect(first.runtime.measurement.renderCpuMeanMs).toBeGreaterThanOrEqual(0)
    expect(first.runtime.models).toHaveLength(1)
    expect(first.runtime.animationSource).toBe(id === 'fill' ? 'procedural' : 'blender')
    if (id !== 'fill') expect(first.runtime.clipName).toMatch(/^Anim_0[67]_.*$/)
    expect(first.runtime.modelBytes).toBeGreaterThan(0)
    expect(first.runtime.modelBytes).toBe(first.runtime.models.reduce((sum, model) => sum + model.bytes, 0))
    expect(first.runtime.readyMs).toBeGreaterThanOrEqual(first.runtime.modelsLoadMs)
    expect(JSON.parse(await page.evaluate(() => window.__copiedProcess))).toEqual(first)
    const draws = await page.evaluate(() => window.__diagnosticDraws)
    await page.waitForTimeout(1100)
    expect((await copy(page)).runtime.measurement).toEqual(first.runtime.measurement)
    expect(await page.evaluate(() => window.__diagnosticDraws)).toBe(draws)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await diagnostic(page).screenshot({ path: testInfo.outputPath('process-diagnostic-320.png') })
  await page.getByRole('button', { name: 'Cerrar prototipo 3D' }).click()
  const closed = await copy(page)
  expect(closed.runtime.state).toBe('closed')
  expect(closed.runtime.running).toBe(false)
  expect(closed.runtime.measurement).not.toBeNull()
  await expect(page.locator('.process-prototype canvas')).toHaveCount(0)
  await open3D(page)
  await expectNoResult(page)
})

test('quality changes and restart invalidate the old sample; completion is not reported as zero FPS', async ({ page }) => {
  await setup(page)
  await toggle(page)
  await open3D(page)
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByTestId('process-diagnostic-fps')).toHaveText(/\d+(\.\d+)? \/ 20 FPS/)
  await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('labvirtual-performance-change', { detail: { preference: 'full', profile: 'full' } })))
  await expectNoResult(page)
  await expect(page.getByTestId('process-diagnostic-fps')).toHaveText('— / 30 FPS')
  await page.getByRole('group', { name: 'Reproducción del prototipo' }).getByRole('button', { name: 'Reiniciar', exact: true }).click()
  await expectNoResult(page)
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByTestId('process-diagnostic-state')).toHaveText('Escena terminada')
  const completed = await copy(page)
  expect(completed.runtime.state).toBe('completed')
  expect(completed.runtime.measurement.renderedFps).toBeGreaterThan(0)
})

test('load failure is copyable with manual fallback and retry starts fresh', async ({ page }) => {
  await setup(page)
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied') } })
  await toggle(page)
  await page.route('**/models/VasoBlender.glb', route => route.fulfill({ status: 404, body: '' }))
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  await expect(page.locator('.process-prototype-stage').getByRole('alert')).toBeVisible()
  const report = await copy(page)
  expect(report.error).toContain('No pudimos preparar')
  expect(report.resultType).toBe('error')
  expect(report.runtime).toMatchObject({ state: 'error', running: false, measurement: null })
  await expect(diagnostic(page)).toContainText('No se pudo copiar automáticamente')
  await page.unroute('**/models/VasoBlender.glb')
  await page.getByRole('button', { name: 'Reintentar prototipo' }).click()
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
  await expectNoResult(page)
  await expect(diagnostic(page)).not.toContainText('Último error:')
})
