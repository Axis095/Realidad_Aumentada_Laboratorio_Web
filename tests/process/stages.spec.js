import { test, expect } from '@playwright/test'
import { PROCESS_STAGES, getStageScenes } from '../../src/components/canvas/processPrototypeState.js'

for (const width of [320, 1366]) test(`all five stages show only their own scenes at ${width}px`, async ({ page }, info) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width, height: 900 })
  await page.addInitScript(() => localStorage.setItem('labvirtual-visual-quality', 'reduced'))
  const requests = [], errors = []
  page.on('request', r => { if (r.url().includes('/models/')) requests.push(new URL(r.url()).pathname) })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/modulo/2')
  const panel = page.locator('.process-prototype'), stage = page.locator('.process-prototype-stage')
  for (const [index, item] of PROCESS_STAGES.entries()) {
    await page.locator('.step-timeline button').nth(index).click()
    await expect(stage).toHaveCount(0)
    const before = requests.length
    const scenes = getStageScenes(index)
    await expect(panel.locator('h3')).toHaveText(item.title)
    await expect(panel.locator('ol li')).toHaveText(scenes.map(s => s.title))
    expect(requests.length).toBe(before)
    await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
    await expect(stage).toHaveAttribute('data-status', 'ready')
    await expect(stage).toHaveAttribute('data-scene', scenes[0].id)
    await expect(panel.locator('.process-prototype-scenes button')).toHaveCount(scenes.length)
    await expect(panel.locator('canvas')).toHaveCount(1)
    for (const scene of scenes) {
      if (scene !== scenes[0]) {
        await panel.getByRole('button', { name: new RegExp(scene.title) }).click()
        await expect(stage).toHaveAttribute('data-status', 'ready')
      }
      await expect(stage).toHaveAttribute('data-scene', scene.id)
      await expect(stage).toHaveAttribute('data-playing', 'false')
      for (const value of ['0', '50', '100', '0']) {
        await page.getByLabel('Avance de la escena').fill(value)
        if (value !== '0') await stage.screenshot({ path: info.outputPath(`${index + 1}-${scene.id}-${value}-${width}.png`) })
      }
      await panel.getByRole('button', { name: 'Reproducir', exact: true }).click()
      await expect(stage).toHaveAttribute('data-playing', 'true')
      await panel.getByRole('button', { name: 'Pausar', exact: true }).click()
      await panel.getByRole('button', { name: 'Reiniciar', exact: true }).click()
      await expect(page.getByLabel('Avance de la escena')).toHaveValue('0')
    }
    expect([...new Set(requests.slice(before))]).toEqual(scenes.map(s => s.modelUrl || '/models/VasoBlender.glb'))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'Cerrar prototipo 3D' }).click()
  await expect(panel.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('changing stage cancels its download and an initial Blender failure can be retried', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('labvirtual-visual-quality', 'reduced'))
  await page.goto('/modulo/2')
  await page.locator('.step-timeline button').nth(1).click()
  let release
  await page.route('**/optimized/medicion-agua.glb', async route => { await new Promise(resolve => { release = resolve }); await route.abort().catch(() => {}) })
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.locator('.step-timeline button').nth(4).click()
  release()
  await page.route('**/optimized/moldeo.glb', r => r.fulfill({ status: 404, body: '' }))
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  const stage = page.locator('.process-prototype-stage')
  await expect(stage.getByRole('alert')).toBeVisible()
  await page.unroute('**/optimized/moldeo.glb')
  await page.getByRole('button', { name: 'Reintentar prototipo' }).click()
  await expect(stage).toHaveAttribute('data-status', 'ready')
  await expect(stage).toHaveAttribute('data-scene', 'mold')
  await expect(page.locator('canvas')).toHaveCount(1)
})
