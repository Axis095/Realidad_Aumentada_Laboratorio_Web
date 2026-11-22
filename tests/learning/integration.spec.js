import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const hash = data => createHash('sha256').update(data).digest('hex')
const jsonGLB = data => JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())

test('derived assets preserve source hashes, animation targets, and low-cost materials', () => {
  const manifest = JSON.parse(fs.readFileSync('public/models/optimized/manifest.json'))
  expect(manifest).toHaveLength(4)
  for (const entry of manifest) {
    const source = fs.readFileSync(`public/models/${entry.source}`), output = fs.readFileSync(`public/models/optimized/${entry.output}`)
    expect(hash(source)).toBe(entry.sourceSha256)
    expect(hash(output)).toBe(entry.outputSha256)
    expect(output.length).toBeLessThan(165000)
    const j = jsonGLB(output)
    expect(j.materials.some(m => m.extensions?.KHR_materials_transmission)).toBe(false)
    if (entry.source.startsWith('process/')) {
      const original = jsonGLB(source)
      expect(j.animations).toHaveLength(1)
      expect(j.animations[0].name).toBe(original.animations[0].name)
      const channels = (model) => model.animations[0].channels.map(c => `${model.nodes[c.target.node].name}:${c.target.path}`).sort()
      expect(channels(j)).toEqual(channels(original))
      expect(j.nodes.some(n => /_Label_/.test(n.name))).toBe(false)
    }
  }
})

async function setup(page, width = 320) {
  await page.setViewportSize({ width, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem('labvirtual-visual-quality', 'reduced')
    window.__learningDraws = 0
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (type) {
      for (const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']) {
        if (!type.prototype[name]) continue
        const original = type.prototype[name]
        type.prototype[name] = function (...args) { window.__learningDraws++; return original.apply(this, args) }
      }
    }
  })
}
const molecularStage = page => page.locator('.molecule-viewer-stage')
const ready = page => expect(molecularStage(page)).toHaveAttribute('data-status', 'ready')

for (const width of [320, 1366]) test(`molecules load on demand, support controls, stay idle and reopen at ${width}px`, async ({ page }, info) => {
  await setup(page, width)
  const requests = [], errors = []
  page.on('request', r => { if (r.url().includes('/models/')) requests.push(new URL(r.url()).pathname) })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/modulo/3')
  await page.getByRole('tab', { name: /Hidróxido de sodio/ }).click()
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Explorar Hidróxido de sodio en 3D' }).click()
  await ready(page)
  await page.locator('.molecule-viewer canvas').evaluate(c => { c.dataset.identity = 'same' })
  for (const name of ['Girar a la izquierda', 'Girar a la derecha', 'Acercar molécula', 'Alejar molécula', 'Centrar']) {
    await page.getByRole('button', { name, exact: true }).click()
  }
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('labvirtual-performance-change', { detail: { profile: 'full', preference: 'full' } })))
  await expect(page.locator('.molecule-viewer canvas')).toHaveAttribute('data-identity', 'same')
  await page.waitForTimeout(100)
  const draws = await page.evaluate(() => window.__learningDraws)
  await page.waitForTimeout(600)
  expect(await page.evaluate(() => window.__learningDraws)).toBe(draws)
  await molecularStage(page).screenshot({ path: info.outputPath(`naoh-${width}.png`) })
  await page.getByRole('tab', { name: /Glicerol/ }).click()
  await expect(page.locator('.molecule-viewer canvas')).toHaveCount(0)
  expect(requests).toEqual(['/models/optimized/naoh.glb'])
  await page.getByRole('button', { name: 'Explorar Glicerol en 3D' }).click()
  await ready(page)
  const before = await page.evaluate(() => window.__learningDraws)
  await page.getByRole('button', { name: 'Girar a la izquierda' }).click()
  expect((await page.evaluate(() => window.__learningDraws)) - before).toBeLessThanOrEqual(5)
  await molecularStage(page).screenshot({ path: info.outputPath(`glicerol-${width}.png`) })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Volver al esquema' }).click()
  await expect(page.locator('.molecule-diagram')).toBeVisible()
  await page.getByRole('button', { name: 'Explorar Glicerol en 3D' }).click()
  await ready(page)
  await page.getByRole('tab', { name: /Triglicérido/ }).click()
  await page.getByRole('tab', { name: /Jabón/ }).click()
  await expect(page.getByRole('button', { name: /Realizar quiz/ })).toBeEnabled()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('molecules recover from missing files and lost context, and cancel pending loads', async ({ page }) => {
  await setup(page)
  await page.goto('/modulo/3')
  await page.getByRole('tab', { name: /Glicerol/ }).click()
  await page.route('**/optimized/glicerol.glb', r => r.fulfill({ status: 404, body: '' }))
  await page.getByRole('button', { name: 'Explorar Glicerol en 3D' }).click()
  await expect(molecularStage(page).getByRole('alert')).toBeVisible()
  await page.unroute('**/optimized/glicerol.glb')
  await page.getByRole('button', { name: 'Reintentar molécula' }).click()
  await ready(page)
  await page.locator('.molecule-viewer canvas').evaluate(c => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(molecularStage(page).getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Reintentar molécula' }).click()
  await ready(page)
  await page.getByRole('tab', { name: /Hidróxido/ }).click()
  let release
  await page.route('**/optimized/naoh.glb', async r => { await new Promise(resolve => { release = resolve }); await r.abort().catch(() => {}) })
  await page.getByRole('button', { name: 'Explorar Hidróxido de sodio en 3D' }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.getByRole('tab', { name: /Glicerol/ }).click()
  release()
  await page.getByRole('button', { name: 'Explorar Glicerol en 3D' }).click()
  await ready(page)
  await expect(page.locator('.molecule-viewer canvas')).toHaveCount(1)
})

test('animated scenes cancel stale selections and recover without replacing the canvas', async ({ page }, info) => {
  await setup(page)
  await page.goto('/modulo/2')
  await expect(page.locator('.process-visual')).toHaveCount(1)
  await page.getByRole('button', { name: 'Abrir prototipo 3D' }).click()
  await expect(page.locator('.process-visual')).toHaveCount(0)
  const stage = page.locator('.process-prototype-stage'), canvas = stage.locator('canvas')
  await expect(stage).toHaveAttribute('data-status', 'ready')
  await canvas.evaluate(c => { c.dataset.identity = 'single' })
  let release
  await page.route('**/optimized/vertido.glb', async r => { await new Promise(resolve => { release = resolve }); await r.abort().catch(() => {}) })
  await page.getByRole('button', { name: /Vertido/, exact: false }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.getByRole('button', { name: /Agitación/ }).click()
  release()
  await expect(stage).toHaveAttribute('data-status', 'ready')
  await expect(stage).toHaveAttribute('data-scene', 'stir')
  await page.unroute('**/optimized/vertido.glb')
  await page.route('**/optimized/vertido.glb', r => r.fulfill({ status: 200, body: 'bad glb' }))
  await page.getByRole('button', { name: /Vertido/ }).click()
  await expect(stage.getByRole('alert')).toBeVisible()
  await page.unroute('**/optimized/vertido.glb')
  await page.getByRole('button', { name: 'Reintentar prototipo' }).click()
  await expect(stage).toHaveAttribute('data-status', 'ready')
  await expect(stage).toHaveAttribute('data-scene', 'pour')
  await expect(canvas).toHaveAttribute('data-identity', 'single')
  for (const [title, id] of [['Vertido','pour'],['Agitación','stir']]) {
    await page.getByRole('button', { name: new RegExp(title) }).click()
    await expect(stage).toHaveAttribute('data-status', 'ready')
    for (const value of ['0','50','100','0']) {
      await page.getByLabel('Avance de la escena').fill(value)
      await stage.screenshot({ path: info.outputPath(`${id}-${value}.png`) })
    }
    await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
    await expect(stage).toHaveAttribute('data-playing', 'true')
    await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  }
  await page.getByRole('button', { name: /Llenado/ }).click()
  await expect(stage).toHaveAttribute('data-status', 'ready')
  await expect(canvas).toHaveAttribute('data-identity', 'single')
  await page.getByRole('button', { name: /Preparar NaOH/ }).click()
  await expect(stage).toHaveCount(0)
  await expect(page.locator('.process-visual')).toHaveCount(1)
  await page.getByRole('link', { name: /Siguiente módulo/ }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
})
