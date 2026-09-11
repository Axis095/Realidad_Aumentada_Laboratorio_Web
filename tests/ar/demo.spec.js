import { expect, test } from '@playwright/test'

// Feed the actual marker detector a synthetic video stream. No browser camera
// permission is granted and the native getUserMedia is never invoked.
async function installCamera(page, { denied = false, deferred = false } = {}) {
  await page.addInitScript(({ denied, deferred }) => {
    const camera = { calls: 0, tracks: [], showMarker: true, release: null }
    window.__arTestCamera = camera
    const mediaDevices = navigator.mediaDevices || {}
    if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: mediaDevices })
    Object.defineProperty(mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        camera.calls += 1
        if (denied) throw new DOMException('Permiso de cámara denegado en la prueba', 'NotAllowedError')
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const context = canvas.getContext('2d')
        const marker = new Image()
        marker.src = '/ar/hiro.png'
        await marker.decode()
        const draw = () => {
          context.fillStyle = '#fff'
          context.fillRect(0, 0, 640, 480)
          if (camera.showMarker) context.drawImage(marker, 140, 60, 360, 360)
        }
        draw()
        const timer = setInterval(draw, 50)
        const stream = canvas.captureStream(20)
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track)
          track.stop = () => { clearInterval(timer); stop() }
          camera.tracks.push(track)
        }
        if (deferred) await new Promise(resolve => { camera.release = resolve })
        return stream
      },
    })
  }, { denied, deferred })
}

async function expectStopped(page) {
  await expect.poll(() => page.evaluate(() => ({
    count: window.__arTestCamera.tracks.length,
    stopped: window.__arTestCamera.tracks.every(track => track.readyState === 'ended'),
  }))).toEqual(expect.objectContaining({ stopped: true }))
  await expect(page.locator('.ar-demo-runtime video')).toHaveCount(0)
}

async function startAR(page) {
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Tarjeta detectada')
  await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(1)
}

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1366, height: 900 }]) {
  test(`landing is lightweight and fits ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await installCamera(page, { denied: true })
    const requests = []
    const errors = []
    page.on('request', request => requests.push(request.url()))
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/ar/beaker')
    await expect(page.getByRole('heading', { name: /El laboratorio llega a/ })).toBeVisible()
    await expect(page.locator('canvas, video')).toHaveCount(0)
    expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
    expect(requests.filter(url => /labARRuntime|artoolkit|camera_para|patt\.hiro|\.wasm/.test(url))).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'Activar cámara', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('preview is reusable, fits mobile, and never starts a camera', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await installCamera(page, { denied: true })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/ar/beaker')
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
    await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
    const canvas = page.locator('.ar-demo-runtime canvas')
    await expect(canvas).toHaveCount(1)
    expect(await canvas.evaluate(element => element.width > 0 && element.height > 0)).toBe(true)
    await page.getByRole('button', { name: 'Girar modelo a la derecha' }).click()
    await page.getByRole('slider').fill('1.6')
    await expect(page.locator('output')).toHaveText('160 %')
    await page.getByRole('button', { name: 'Restablecer', exact: true }).click()
    await expect(page.locator('output')).toHaveText('100 %')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (cycle === 0) await page.screenshot({ path: testInfo.outputPath('preview-320.png'), fullPage: true })
    await page.getByRole('button', { name: 'Cerrar vista 3D' }).click()
    await expect(canvas).toHaveCount(0)
  }
  expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
  expect(errors).toEqual([])
})

test('permission denial explains recovery and allows preview', async ({ page }) => {
  await installCamera(page, { denied: true })
  await page.goto('/ar/beaker')
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.locator('.ar-demo-status')).toHaveText('No se pudo iniciar')
  await expect(page.locator('.ar-demo-runtime video, .ar-demo-runtime canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('actual tracker finds and loses Hiro, and stops camera on mode switch and close', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installCamera(page)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/ar/beaker')
  await startAR(page)
  await page.screenshot({ path: testInfo.outputPath('hiro-detected.png'), fullPage: true })
  await page.evaluate(() => { window.__arTestCamera.showMarker = false })
  await expect(page.locator('.ar-demo-status')).toHaveText('Vuelve a encuadrar la tarjeta')
  await page.evaluate(() => { window.__arTestCamera.showMarker = true })
  await expect(page.locator('.ar-demo-status')).toHaveText('Tarjeta detectada')
  await page.getByRole('button', { name: 'Explorar sin cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Vista 3D sin cámara')
  await expectStopped(page)
  await startAR(page)
  await page.getByRole('button', { name: 'Cerrar experiencia y apagar cámara' }).click()
  await expectStopped(page)
  await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('hiding the page and leaving its route release every camera track', async ({ page }) => {
  await installCamera(page)
  await page.goto('/ar/beaker')
  await startAR(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.ar-demo-status')).toHaveText('Experiencia pausada')
  await expectStopped(page)
  await page.evaluate(() => { delete document.hidden })
  await startAR(page)
  await page.getByRole('link', { name: 'Obtener tarjeta' }).click()
  await expect(page).toHaveURL(/\/ar\/tarjeta$/)
  await expectStopped(page)
})

test('closing while camera permission is pending stops a late stream', async ({ page }) => {
  await installCamera(page, { deferred: true })
  await page.goto('/ar/beaker')
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect.poll(() => page.evaluate(() => Boolean(window.__arTestCamera.release))).toBe(true)
  await page.getByRole('button', { name: 'Cerrar experiencia y apagar cámara' }).click()
  await page.evaluate(() => window.__arTestCamera.release())
  await expectStopped(page)
  await expect(page.locator('.ar-demo-status')).toHaveText('Listo para explorar')
  await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(0)
})

test('print card refuses local URLs and generates its QR for the stable public route', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await installCamera(page, { denied: true })
  await page.goto('/ar/tarjeta')
  const print = page.getByRole('button', { name: 'Imprimir tarjeta', exact: true })
  const address = page.getByLabel('Dirección pública de la plataforma', { exact: true })
  await expect(print).toBeDisabled()
  for (const invalid of ['http://demo.vercel.app', 'https://localhost:5173', 'https://192.168.1.20']) {
    await address.fill(invalid)
    await expect(print).toBeDisabled()
    await expect(page.getByRole('img', { name: 'Código QR para abrir la experiencia de realidad aumentada' })).toHaveCount(0)
  }
  await address.fill('https://laboratorio-demo.vercel.app/modulo/1?evento=prueba')
  await expect(page.locator('#ar-public-status a')).toHaveAttribute('href', 'https://laboratorio-demo.vercel.app/ar/beaker')
  await expect(print).toBeEnabled()
  const qr = page.getByRole('img', { name: 'Código QR para abrir la experiencia de realidad aumentada' })
  await expect(qr).toHaveAttribute('src', /^data:image\/svg\+xml/)
  expect(await qr.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('card-320.png'), fullPage: true })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.ar-print-tools').first()).toBeHidden()
  await expect(page.locator('.ar-print-card')).toBeVisible()
  await expect(page.getByRole('img', { name: /Marcador Hiro/ })).toBeVisible()
  const printable = await page.pdf({ path: testInfo.outputPath('card-print.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true })
  expect(printable.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1)
  expect(await page.evaluate(() => window.__arTestCamera.calls)).toBe(0)
})
