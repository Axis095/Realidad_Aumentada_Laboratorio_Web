import { test, expect } from '@playwright/test'
import { getProcessPose } from '../../src/components/canvas/processPrototypeState.js'

const panel = page => page.locator('.process-prototype')
const progress = page => page.getByLabel('Avance de la escena', { exact: false })
async function setup(page, width = 320) {
  await page.setViewportSize({ width, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem('labvirtual-visual-quality', 'reduced')
    window.__processDraws = 0
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!type) continue
      for (const name of ['drawArrays', 'drawElements']) {
        const original = type.prototype[name]
        type.prototype[name] = function (...args) { window.__processDraws++; return original.apply(this, args) }
      }
    }
  })
  await page.goto('/modulo/2')
}
async function open(page) {
  await page.getByRole('button', { name: 'Abrir prototipo 3D', exact: true }).click()
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
  await expect(panel(page).locator('canvas')).toHaveCount(1)
}

test('poses are deterministic, finite, and transfer only during the pouring window', () => {
  expect(getProcessPose('fill', 0).receiverLevel).toBe(0)
  expect(getProcessPose('fill', 1).receiverLevel).toBeCloseTo(0.6)
  expect(getProcessPose('pour', 0).receiverLevel).toBeCloseTo(0.6)
  expect(getProcessPose('pour', 1).receiverLevel).toBeCloseTo(0.9)
  expect(getProcessPose('pour', 1).donorLevel).toBe(0)
  expect(getProcessPose('pour', 0).stream).toBe(false)
  expect(getProcessPose('pour', 0.5).stream).toBe(true)
  expect(getProcessPose('pour', 1).stream).toBe(false)
  expect(getProcessPose('stir', 1).mixed).toBe(1)
  expect(getProcessPose('stir', 0.45)).toEqual(getProcessPose('stir', 0.45))
  for (const id of ['fill', 'pour', 'stir']) for (const t of [NaN, -1, 0, 0.2, 0.5, 0.8, 1, 2]) {
    const pose = getProcessPose(id, t)
    expect(pose.progress).toBeGreaterThanOrEqual(0)
    expect(pose.progress).toBeLessThanOrEqual(1)
    expect(Object.values(pose).filter(v => typeof v === 'number').every(Number.isFinite)).toBe(true)
  }
})

test('module stays lightweight without opting in and preserves its learning steps', async ({ page }) => {
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await setup(page)
  await expect(page.getByRole('button', { name: 'Abrir prototipo 3D' })).toBeVisible()
  await expect(panel(page).locator('canvas')).toHaveCount(0)
  expect(requests.some(url => /processPrototypeRuntime|\.glb/.test(url))).toBe(false)
  await page.getByRole('button', { name: /Preparar NaOH/ }).click()
  await expect(page.getByRole('button', { name: 'Agregar NaOH lentamente al agua' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

for (const width of [320, 1366]) test(`three scenes, playback, seeking and reset fit ${width}px`, async ({ page }, testInfo) => {
  const errors = [], models = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (/\/models\//.test(request.url())) models.push(new URL(request.url()).pathname) })
  await setup(page, width)
  await open(page)
  const canvas = panel(page).locator('canvas')
  await canvas.evaluate(element => { element.dataset.identity = 'original' })
  await panel(page).getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect.poll(async () => Number(await progress(page).inputValue())).toBeGreaterThan(3)
  await panel(page).getByRole('button', { name: 'Pausar', exact: true }).click()
  const paused = await progress(page).inputValue()
  const draws = await page.evaluate(() => window.__processDraws)
  await page.waitForTimeout(500)
  expect(await progress(page).inputValue()).toBe(paused)
  expect(await page.evaluate(() => window.__processDraws)).toBe(draws)
  for (const [name, value] of [['Llenado', '80'], ['Vertido', '50'], ['Agitación', '60']]) {
    await panel(page).getByRole('button', { name: new RegExp(name) }).click()
    await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
    await expect(progress(page)).toHaveValue('0')
    const beforeSeek = await page.evaluate(() => window.__processDraws)
    await progress(page).fill(value)
    const afterSeek = await page.evaluate(() => window.__processDraws)
    expect(afterSeek - beforeSeek).toBeGreaterThan(0)
    expect(afterSeek - beforeSeek).toBeLessThanOrEqual(15)
    await expect(canvas).toHaveAttribute('data-identity', 'original')
    await page.locator('.process-prototype-stage').screenshot({ path: testInfo.outputPath(`${name}-${width}.png`) })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await panel(page).screenshot({ path: testInfo.outputPath(`panel-${width}.png`) })
  await progress(page).fill('100')
  await expect(panel(page)).toContainText('Escena terminada')
  await panel(page).getByRole('button', { name: 'Reiniciar', exact: true }).click()
  await expect(progress(page)).toHaveValue('0')
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-playing', 'false')
  expect([...new Set(models)].sort()).toEqual(['/models/VasoBlender.glb', '/models/optimized/agitacion.glb', '/models/optimized/vertido.glb'])
  await page.getByRole('button', { name: 'Cerrar prototipo 3D' }).click()
  await expect(canvas).toHaveCount(0)
  await open(page)
  await expect(progress(page)).toHaveValue('0')
  expect(errors).toEqual([])
})

test('natural completion stops rendering and a quality change preserves the single canvas', async ({ page }) => {
  await setup(page, 390)
  await open(page)
  await panel(page).locator('canvas').evaluate(canvas => { canvas.dataset.identity = 'same-context' })
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('labvirtual-performance-change', { detail: { preference: 'full', profile: 'full' } }))
  })
  await expect(panel(page)).toContainText('Completo · hasta 30 FPS')
  await progress(page).fill('95')
  await panel(page).getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(panel(page)).toContainText('Escena terminada')
  await expect(progress(page)).toHaveValue('100')
  await expect(panel(page).locator('canvas')).toHaveAttribute('data-identity', 'same-context')
  const draws = await page.evaluate(() => window.__processDraws)
  await page.waitForTimeout(350)
  expect(await page.evaluate(() => window.__processDraws)).toBe(draws)
})

test('hidden or off-screen playback pauses without jumping ahead on return', async ({ page }) => {
  await setup(page)
  await open(page)
  await panel(page).getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-playing', 'true')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-playing', 'false')
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await panel(page).getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-playing', 'false')
  await page.getByRole('link', { name: /Siguiente módulo/ }).click()
  await expect(panel(page)).toHaveCount(0)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Abrir prototipo 3D' })).toBeVisible()
  await expect(panel(page).locator('canvas')).toHaveCount(0)
})

for (const failure of ['missing', 'corrupt', 'context']) test(`recovers from ${failure} without blocking the module`, async ({ page }) => {
  await setup(page)
  if (failure !== 'context') await page.route('**/models/VasoBlender.glb', route => route.fulfill({ status: failure === 'missing' ? 404 : 200, body: 'invalid', contentType: 'model/gltf-binary' }))
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  if (failure === 'context') {
    await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
    await panel(page).locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  }
  await expect(panel(page).getByRole('alert')).toBeVisible()
  await expect(panel(page).locator('canvas')).toHaveCount(0)
  await page.unroute('**/models/VasoBlender.glb')
  await page.getByRole('button', { name: 'Reintentar prototipo' }).click()
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-status', 'ready')
  await expect(panel(page).locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: /Preparar NaOH/ }).click()
  await expect(page.getByRole('button', { name: 'Agregar NaOH lentamente al agua' })).toBeVisible()
})

test('cancels pending downloads on close and respects reduced motion without autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let release
  await page.route('**/models/VasoBlender.glb', async route => {
    await new Promise(resolve => { release = resolve })
    await route.abort().catch(() => {})
  })
  await setup(page)
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.getByRole('button', { name: 'Cerrar prototipo 3D' }).click()
  release()
  await page.unroute('**/models/VasoBlender.glb')
  await open(page)
  await expect(page.locator('.process-prototype-stage')).toHaveAttribute('data-playing', 'false')
  await progress(page).fill('45')
  await expect(progress(page)).toHaveValue('45')
})
