import { expect } from '@playwright/test'

// Feed the actual marker detector a synthetic video stream. No browser camera
// permission is granted and the native getUserMedia is never invoked.
export async function installCamera(page, { denied = false, deferred = false, markerUrl = '/ar/hiro.png' } = {}) {
  await page.addInitScript(({ denied, deferred, markerUrl }) => {
    const camera = { calls: 0, tracks: [], showMarker: true, rotation: 0, release: null }
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
        let marker
        camera.setMarker = async (url) => {
          const next = new Image()
          next.src = url
          await next.decode()
          marker = next
        }
        await camera.setMarker(markerUrl)
        const draw = () => {
          context.fillStyle = '#fff'
          context.fillRect(0, 0, 640, 480)
          if (camera.showMarker) {
            context.save()
            context.translate(320, 240)
            context.rotate(camera.rotation * Math.PI / 2)
            context.drawImage(marker, -180, -180, 360, 360)
            context.restore()
          }
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
  }, { denied, deferred, markerUrl })
}

export async function expectStopped(page) {
  await expect.poll(() => page.evaluate(() => ({
    count: window.__arTestCamera.tracks.length,
    stopped: window.__arTestCamera.tracks.every(track => track.readyState === 'ended'),
  }))).toEqual(expect.objectContaining({ stopped: true }))
  await expect(page.locator('.ar-demo-runtime video')).toHaveCount(0)
}

export async function startAR(page) {
  await page.getByRole('button', { name: 'Activar cámara', exact: true }).click()
  await expect(page.locator('.ar-demo-status')).toHaveText('Tarjeta detectada')
  await expect(page.locator('.ar-demo-runtime canvas')).toHaveCount(1)
}
