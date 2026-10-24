import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import QRCode from 'qrcode'
import { AR_INSTRUMENTS } from '../../src/data/instruments.js'
import { markerPatterns } from '../../scripts/ar-marker-patterns.mjs'
import { installCamera, expectStopped, startAR } from './cameraHelpers'

test('catalog paths, GLBs and permanent marker assets exist and are distinct', () => {
  expect(AR_INSTRUMENTS).toHaveLength(12)
  expect(new Set(AR_INSTRUMENTS.map(i => i.id)).size).toBe(12)
  expect(new Set(Object.values(markerPatterns)).size).toBe(12)
  for (const item of AR_INSTRUMENTS) {
    const bytes = fs.readFileSync(`public${item.modelUrl}`)
    expect(bytes.toString('ascii', 0, 4)).toBe('glTF')
    const values = fs.readFileSync(`public${item.markerPattern}`, 'utf8').trim().split(/\s+/).map(Number)
    expect(values).toHaveLength(4 * 3 * 16 * 16)
    expect(values.every(n => n === 0 || n === 255)).toBe(true)
    expect(fs.existsSync(`public${item.markerImage}`)).toBe(true)
  }
})

test('catalog stays lightweight, is mobile friendly and handles invalid links', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 })
  const requests = []
  page.on('request', r => requests.push(r.url()))
  await page.goto('/ar')
  await expect(page.locator('.ar-catalog-item')).toHaveCount(12)
  expect(requests.filter(url => /\.glb|ARToolkit|labARRuntime/.test(url))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('catalog-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.screenshot({ path: testInfo.outputPath('catalog-desktop.png'), fullPage: true })
  for (const route of ['/ar/desconocido', '/ar/tarjeta?instrumento=no-existe']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: 'Instrumento no encontrado' })).toBeVisible()
    await expect(page.locator('canvas, video')).toHaveCount(0)
  }
})

test('each selector entry loads only its own final GLB, never starts the camera, and can be revisited', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await installCamera(page, { denied: true })
  const errors = [], modelRequests = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('request', r => { if (r.url().includes('/models/')) modelRequests.push(decodeURI(new URL(r.url()).pathname)) })
  await page.goto('/ar/beaker')
  for (const item of [...AR_INSTRUMENTS, AR_INSTRUMENTS[0]]) {
    await page.getByLabel('Selecciona un instrumento').selectOption(item.id)
    await expect(page.locator('.ar-demo-status')).toHaveText('Listo para explorar')
    await expect(page.locator('canvas, video')).toHaveCount(0)
    const before = modelRequests.length
    await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
    await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
    expect(modelRequests.slice(before)).toEqual([item.modelUrl])
    await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (['beaker', 'matraz-erlenmeyer', 'gafas'].includes(item.id)) {
      await page.locator('.ar-demo-stage').screenshot({ path: testInfo.outputPath(`preview-${item.id}.png`) })
    }
    await page.getByRole('button', { name: 'Cerrar vista 3D' }).click()
  }
  expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
  expect(errors).toEqual([])
})

for (const [index, item] of AR_INSTRUMENTS.entries()) {
  test(`${item.id}: actual tracker recognizes its marker rotated and rejects a different card`, async ({ page }, testInfo) => {
    await installCamera(page, { markerUrl: item.markerImage })
    await page.goto(`/ar/${item.id}`)
    await startAR(page)
    if (item.id === 'beaker') await page.locator('.ar-demo-stage').screenshot({ path: testInfo.outputPath('beaker-marker.png') })
    for (const rotation of [1, 2, 3]) {
      await page.evaluate(r => { window.__arTestCamera.showMarker = false; window.__arTestCamera.rotation = r }, rotation)
      await expect(page.locator('.ar-demo-status')).toHaveText('Vuelve a encuadrar la tarjeta')
      await page.evaluate(() => { window.__arTestCamera.showMarker = true })
      await expect(page.locator('.ar-demo-status')).toHaveText('Tarjeta detectada')
    }
    await page.evaluate(url => window.__arTestCamera.setMarker(url), AR_INSTRUMENTS[(index + 1) % AR_INSTRUMENTS.length].markerImage)
    await expect(page.locator('.ar-demo-status')).toHaveText('Vuelve a encuadrar la tarjeta')
    await page.getByRole('button', { name: 'Cerrar experiencia y apagar cámara' }).click()
    await expectStopped(page)
  })
}

test('changing instruments while the camera is running releases its tracks', async ({ page }) => {
  await installCamera(page)
  await page.goto('/ar/beaker')
  await startAR(page)
  await page.getByLabel('Selecciona un instrumento').selectOption('probeta')
  await expectStopped(page)
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.ar-demo-status')).toHaveText('Listo para explorar')
  await page.goBack()
  await startAR(page)
})

test('failed GLB stops camera, can retry and does not block selecting another model', async ({ page }) => {
  await installCamera(page)
  await page.route('**/models/VasoBlender.glb', route => route.fulfill({ status: 404, body: 'missing' }))
  await page.goto('/ar/beaker')
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar')
  await expectStopped(page)
  await page.unroute('**/models/VasoBlender.glb')
  await startAR(page)
  await page.getByLabel('Selecciona un instrumento').selectOption('gafas')
  await expectStopped(page)
  await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
})

test('all cards match title, marker and QR; print is one A4 page', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/ar/tarjeta?instrumento=probeta')
  await expect(page.getByLabel('Selecciona un instrumento')).toHaveValue('probeta')
  await page.getByLabel('Dirección pública de la plataforma', { exact: true }).fill('https://laboratorio-demo.vercel.app')
  for (const item of AR_INSTRUMENTS) {
    await page.emulateMedia({ media: 'screen' })
    await page.getByLabel('Selecciona un instrumento').selectOption(item.id)
    await expect(page.getByRole('button', { name: 'Imprimir tarjeta', exact: true })).toBeEnabled()
    await expect(page.locator('.ar-print-card-title h2')).toHaveText(item.title)
    await expect(page.locator('.ar-print-marker img')).toHaveAttribute('src', item.markerImage)
    const destination = `https://laboratorio-demo.vercel.app/ar/${item.id}`
    await expect(page.locator('#ar-public-status a')).toHaveAttribute('href', destination)
    const svg = await QRCode.toString(destination, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 224, color: { dark: '#000000', light: '#ffffff' } })
    await expect(page.locator('.ar-print-qr-box img')).toHaveAttribute('src', `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    await expect(page.getByRole('link', { name: /Descargar solo el QR/ })).toHaveAttribute('download', `qr-${item.id}.svg`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.emulateMedia({ media: 'print' })
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true })
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g), item.id).toHaveLength(1)
  }
  await page.setViewportSize({ width: 794, height: 1123 })
  await page.screenshot({ path: testInfo.outputPath('printed-card.png'), fullPage: true })
})

test('changing instrument cancels a pending model download and stops its camera', async ({ page }) => {
  await installCamera(page)
  let release
  await page.route('**/models/VasoBlender.glb', async route => {
    await new Promise(resolve => { release = resolve })
    await route.fulfill({ status: 404, body: 'late response' }).catch(() => {})
  })
  await page.goto('/ar/beaker')
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect.poll(() => Boolean(release)).toBe(true)
  await page.getByLabel('Selecciona un instrumento').selectOption('gafas')
  await expectStopped(page)
  release()
  await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(1)
})

test('a missing marker cannot print a stale card after changing selection', async ({ page }) => {
  await page.route('**/ar/markers/probeta.svg', route => route.fulfill({ status: 404, body: 'missing' }))
  await page.goto('/ar/tarjeta')
  await page.getByLabel('Dirección pública de la plataforma', { exact: true }).fill('https://laboratorio-demo.vercel.app')
  const print = page.getByRole('button', { name: 'Imprimir tarjeta', exact: true })
  await expect(print).toBeEnabled()
  await page.getByLabel('Selecciona un instrumento').selectOption('probeta')
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar el marcador')
  await expect(print).toBeDisabled()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.ar-print-card')).toBeHidden()
})
