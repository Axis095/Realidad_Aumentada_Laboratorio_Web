import { expect, test } from '@playwright/test'
import { BoxGeometry, Group, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { getModelFrame, measureModel } from '../../src/utils/modelFraming.js'

test('normalization preserves the template and framing fits every corner in portrait and landscape', () => {
  for (const dimensions of [[15.6, 6.12, 9.83], [0.1, 3.23, 0.072], [55.5, 5, 47.3], [0.77, 1.02, 0.72]]) {
    const group = new Group()
    const mesh = new Mesh(new BoxGeometry(...dimensions))
    mesh.position.set(7, -3, 12)
    group.add(mesh)
    const measured = measureModel(group)
    expect(mesh.position.toArray()).toEqual([7, -3, 12])
    expect(Math.max(...measured.size.toArray())).toBeCloseTo(2.6)
    expect(measured.offset).toEqual([-7, 3, -12])
    for (const aspect of [0.7, 1, 2.5]) {
      const camera = new PerspectiveCamera(45, aspect, 0.01, 100)
      camera.position.copy(getModelFrame(measured.size, aspect).position)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const projected = new Vector3(x * measured.size.x / 2, y * measured.size.y / 2, z * measured.size.z / 2).project(camera)
        expect(Math.abs(projected.x)).toBeLessThanOrEqual(0.680001)
        expect(Math.abs(projected.y)).toBeLessThanOrEqual(0.740001)
        expect(projected.z).toBeLessThan(1)
        expect(projected.z).toBeGreaterThan(-1)
      }
    }
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
  expect(() => measureModel(new Group())).toThrow(/geometría/)
})

async function setup(page, quality = 'reduced') {
  await page.addInitScript(quality => localStorage.setItem('labvirtual-visual-quality', quality), quality)
}

async function ready(page, id) {
  await expect(page.locator('.m1-scene')).toHaveAttribute('data-model-id', id)
  await expect(page.locator('.m1-scene')).toHaveAttribute('data-model-status', 'ready')
  await expect(page.locator('.m1-scene canvas')).toHaveCount(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
}

for (const width of [320, 1366]) {
  test(`all instruments load, revisit and fit the interface at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await setup(page)
    const errors = []
    const modelRequests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (request.url().includes('/models/')) modelRequests.push(request.url()) })
    await page.goto('/modulo/1')
    const ids = ['beaker', 'probeta', 'balanza', 'termo', 'agitador', 'espatula', 'guantes', 'parrilla', 'molde', 'gafas']
    for (const [index, id] of ids.entries()) {
      await page.locator('.m1-tab').nth(index).click()
      await ready(page, id)
      if (['beaker', 'gafas', 'termo'].includes(id)) {
        await page.locator('.m1-canvas-box').screenshot({ path: testInfo.outputPath(`${id}-${width}.png`) })
      }
    }
    expect(modelRequests.some(url => url.endsWith('/AgitadorVidrio.glb'))).toBe(true)
    expect(modelRequests.some(url => /VasoFinal|SoporteUniversal/.test(url))).toBe(false)
    // No context replacement when selecting another asset or toggling details.
    await page.locator('.m1-scene canvas').evaluate(canvas => { canvas.dataset.testIdentity = 'original' })
    await page.locator('.m1-tab').first().click()
    await ready(page, 'beaker')
    await page.getByRole('button', { name: /Ver detalles/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar detalles' }).click()
    await expect(page.locator('.m1-scene canvas')).toHaveAttribute('data-test-identity', 'original')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('link', { name: /Siguiente módulo/ }).click()
    await page.goBack()
    await ready(page, 'beaker')
    expect(errors).toEqual([])
  })
}

for (const failure of ['404', 'html', 'corrupt']) {
  test(`a ${failure} model is isolated, another model works, and retry refetches`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await setup(page)
    let fail = true
    let requests = 0
    await page.route('**/models/VasoBlender.glb', route => {
      requests += 1
      return fail ? route.fulfill({ status: failure === '404' ? 404 : 200,
        contentType: failure === 'html' ? 'text/html' : 'application/octet-stream',
        body: failure === 'html' ? '<!doctype html><html></html>' : 'not a GLB' }) : route.continue()
    })
    await page.goto('/modulo/1')
    await expect(page.getByRole('alert')).toContainText('No se pudo mostrar vaso de precipitados')
    await expect(page.locator('.m1-scene')).toHaveAttribute('data-model-status', 'error')
    await expect(page.locator('.m1-tab')).toHaveCount(10)
    if (failure === '404') await page.locator('.m1-canvas-box').screenshot({ path: testInfo.outputPath('error-mobile.png') })
    await page.getByRole('button', { name: 'Instrumento siguiente' }).click()
    await ready(page, 'probeta')
    await page.getByRole('button', { name: 'Instrumento anterior' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await page.getByRole('button', { name: 'Reintentar modelo' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Reintentar modelo' }).click()
    await ready(page, 'beaker')
    expect(requests).toBeGreaterThanOrEqual(3)
  })
}

test('optional studio lighting failure does not hide the instrument', async ({ page }) => {
  await setup(page, 'full')
  await page.route('**/*.hdr', route => route.abort())
  await page.goto('/modulo/1')
  await ready(page, 'beaker')
  await page.locator('.m1-tab').nth(9).click()
  await ready(page, 'gafas')
})
