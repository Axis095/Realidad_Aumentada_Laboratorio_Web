import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { AR_DEMO } from './arDemoConfig'
import { createDemoBeaker } from './demoBeaker'

const abortError = () => new DOMException('Experiencia cancelada', 'AbortError')
// ARToolkit uses shared WASM state while constructing controllers. Serialize startup/teardown.
let trackerQueue = Promise.resolve()

function waitFor(promise, signal, lateDispose = () => {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const abort = () => { settled = true; reject(abortError()) }
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
    promise.then((value) => {
      signal.removeEventListener('abort', abort)
      if (settled) lateDispose(value)
      else { settled = true; resolve(value) }
    }, (error) => {
      signal.removeEventListener('abort', abort)
      if (!settled) { settled = true; reject(error) }
    })
  })
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function cameraError(error) {
  const messages = {
    NotAllowedError: 'No se autorizó la cámara. Puedes permitirla en el navegador o explorar el modelo sin cámara.',
    NotFoundError: 'No encontramos una cámara. Puedes explorar el modelo en la vista 3D.',
    NotReadableError: 'La cámara está ocupada. Cierra otras aplicaciones que la utilicen e inténtalo de nuevo.',
    OverconstrainedError: 'La cámara no admite esta configuración. Prueba la vista sin cámara.',
  }
  return new Error(messages[error.name] || 'No pudimos iniciar la cámara. Intenta de nuevo o utiliza la vista 3D.')
}

function releaseScene(scene) {
  const geometries = new Set()
  const materials = new Set()
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    if (object.material) {
      const list = Array.isArray(object.material) ? object.material : [object.material]
      list.forEach((material) => materials.add(material))
    }
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  scene.clear()
}

export async function createLabExperience({ container, mode, reduced = true, signal, onStatus = () => {}, onError = () => {} }) {
  const lifetime = new AbortController()
  let disposed = false
  let stream, video, renderer, controller, controls, resizeObserver
  let frame = 0
  let initTimer
  const scene = new THREE.Scene()
  const camera = mode === 'ar' ? new THREE.Camera() : new THREE.PerspectiveCamera(40, 1, 0.01, 100)
  const anchor = new THREE.Group()
  const model = createDemoBeaker(reduced)
  scene.add(new THREE.HemisphereLight('#ffffff', '#8fac9d', 2))
  const light = new THREE.DirectionalLight('#ffffff', 2)
  light.position.set(2, 4, 3)
  scene.add(light, anchor)
  anchor.add(model)
  let lastStatus
  const status = (value) => {
    if (!disposed && lastStatus !== value) { lastStatus = value; onStatus(value) }
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    lifetime.abort()
    signal?.removeEventListener('abort', dispose)
    clearTimeout(initTimer)
    cancelAnimationFrame(frame)
    stopStream(stream)
    if (video) { video.pause(); video.srcObject = null; video.remove() }
    resizeObserver?.disconnect()
    controls?.dispose()
    if (controller) { controller.dispose(); controller = null }
    releaseScene(scene)
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }
  const fail = (error) => { if (!disposed) { dispose(); onError(error) } }
  const contextLost = (event) => {
    event.preventDefault()
    fail(new Error('Se interrumpió la vista 3D. Cierra otras aplicaciones e inicia de nuevo la experiencia.'))
  }
  const render = () => { if (!disposed && renderer) renderer.render(scene, camera) }

  signal?.addEventListener('abort', dispose, { once: true })
  try {
    if (signal?.aborted) { dispose(); throw abortError() }
    status('loading')
    if (mode === 'ar') {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('La cámara necesita una dirección HTTPS. Abre la versión publicada o explora sin cámara.')
      }
      if (typeof WebAssembly === 'undefined') throw new Error('Este navegador no admite el seguimiento. Prueba la vista sin cámara.')
      // The browser permission dialog cannot be cancelled, but a late stream is always stopped.
      try {
        stream = await waitFor(navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: reduced ? 20 : 30, max: 30 } },
        }), lifetime.signal, stopStream)
      } catch (error) {
        if (error.name === 'AbortError') throw error
        throw cameraError(error)
      }
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
        fail(new Error('La cámara se ha desconectado. Puedes volver a activarla o continuar sin cámara.'))
      }, { once: true }))
      video = document.createElement('video')
      video.muted = true
      video.autoplay = true
      video.playsInline = true
      video.setAttribute('playsinline', '')
      video.setAttribute('aria-hidden', 'true')
      video.srcObject = stream
      Object.assign(video.style, { position: 'absolute', objectFit: 'cover', maxWidth: 'none', zIndex: '0' })
      container.appendChild(video)
      await waitFor(video.play(), lifetime.signal)
      if (lifetime.signal.aborted) throw abortError()
    }

    try {
      renderer = new THREE.WebGLRenderer({ alpha: mode === 'ar', antialias: false, powerPreference: 'low-power' })
    } catch {
      throw new Error('Este navegador no pudo abrir la vista 3D. Puedes consultar la ficha y la tarjeta del instrumento.')
    }
    renderer.setPixelRatio(reduced ? 1 : Math.min(window.devicePixelRatio || 1, 1.35))
    renderer.setClearColor(mode === 'ar' ? '#000000' : '#edf7f1', mode === 'ar' ? 0 : 1)
    renderer.domElement.setAttribute('aria-label', mode === 'ar' ? 'Modelo sobre el marcador' : 'Vista 3D del vaso')
    Object.assign(renderer.domElement.style, { position: 'absolute', maxWidth: 'none', zIndex: '1' })
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    container.appendChild(renderer.domElement)

    const resize = () => {
      if (disposed) return
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      // Camera crop, tracking input and renderer all share a 4:3 aspect. No stretched overlay.
      const viewWidth = mode === 'ar' ? Math.min(width, height * 4 / 3) : width
      const viewHeight = mode === 'ar' ? viewWidth * 3 / 4 : height
      const style = { width: `${viewWidth}px`, height: `${viewHeight}px`, left: `${(width - viewWidth) / 2}px`, top: `${(height - viewHeight) / 2}px` }
      Object.assign(renderer.domElement.style, style)
      if (video) Object.assign(video.style, style)
      renderer.setSize(viewWidth, viewHeight, false)
      if (mode !== 'ar') { camera.aspect = viewWidth / viewHeight; camera.updateProjectionMatrix() }
      render()
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    if (mode !== 'ar') {
      camera.position.set(1.9, 1.7, 2.8)
      controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 0.57, 0)
      controls.enablePan = false
      controls.enableDamping = false
      controls.minDistance = 1.6
      controls.maxDistance = 5
      controls.maxPolarAngle = Math.PI * 0.49
      controls.update()
      controls.saveState()
      controls.addEventListener('change', render)
      resize()
      status('found')
    } else {
      anchor.visible = false
      anchor.matrixAutoUpdate = false
      model.rotation.x = Math.PI / 2
      const detectionCanvas = document.createElement('canvas')
      detectionCanvas.width = reduced ? 480 : 640
      detectionCanvas.height = reduced ? 360 : 480
      const context = detectionCanvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('No pudimos preparar el seguimiento. Prueba otro navegador o la vista sin cámara.')
      initTimer = setTimeout(() => fail(new Error('El seguimiento está tardando demasiado. Revisa la conexión e inténtalo de nuevo.')), 25000)
      const initialization = trackerQueue.catch(() => {}).then(async () => {
        if (lifetime.signal.aborted) throw abortError()
        const { default: toolkit } = await import('@ar-js-org/artoolkit5-js')
        if (lifetime.signal.aborted) throw abortError()
        // Preflight these small local assets: don't feed Vite's HTML fallback to the binary loader.
        for (const path of [AR_DEMO.cameraParameters, AR_DEMO.markerPattern]) {
          const response = await fetch(path, { signal: lifetime.signal })
          if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
            throw new Error('No se pudo cargar el marcador de la demo. Revisa la conexión y vuelve a intentarlo.')
          }
          await response.arrayBuffer()
        }
        const next = await toolkit.ARController.initWithDimensions(detectionCanvas.width, detectionCanvas.height, AR_DEMO.cameraParameters)
        // The library schedules a 'load' event after resolving initialization.
        await new Promise((resolve) => setTimeout(resolve, 5))
        try {
          if (lifetime.signal.aborted) throw abortError()
          const markerId = await next.loadMarker(AR_DEMO.markerPattern)
          if (lifetime.signal.aborted) throw abortError()
          next.trackPatternMarkerId(markerId, 1)
          next.setPatternDetectionMode(next.artoolkit.AR_TEMPLATE_MATCHING_MONO)
          next.setThresholdMode(next.artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)
          return { tracker: next, markerId }
        } catch (error) { next.dispose(); throw error }
      })
      trackerQueue = initialization.then(() => {}, () => {})
      const loaded = await waitFor(initialization, lifetime.signal, ({ tracker }) => tracker.dispose())
      controller = loaded.tracker
      clearTimeout(initTimer)
      camera.projectionMatrix.fromArray(controller.getCameraMatrix())
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
      let detected = false
      let everFound = false
      const pose = new THREE.Matrix4()
      const position = new THREE.Vector3()
      const rotation = new THREE.Quaternion()
      const scale = new THREE.Vector3()
      controller.addEventListener('getMarker', (event) => {
        if (event.data.marker.idPatt !== loaded.markerId || event.data.marker.cfPatt < 0.6) return
        pose.fromArray(event.data.matrixGL_RH)
        pose.decompose(position, rotation, scale)
        if (anchor.visible) {
          anchor.position.lerp(position, 0.65)
          anchor.quaternion.slerp(rotation, 0.65)
        } else {
          anchor.position.copy(position)
          anchor.quaternion.copy(rotation)
        }
        anchor.scale.copy(scale)
        anchor.updateMatrix()
        detected = true
      })
      const interval = 1000 / (reduced ? 15 : 24)
      let lastFrame = -Infinity
      const tick = (now) => {
        if (disposed) return
        frame = requestAnimationFrame(tick)
        if (now - lastFrame < interval || video.readyState < 2) return
        lastFrame = now
        // Match object-fit: cover on the displayed video, including portrait camera streams.
        const ratio = Math.max(detectionCanvas.width / video.videoWidth, detectionCanvas.height / video.videoHeight)
        const width = video.videoWidth * ratio
        const height = video.videoHeight * ratio
        context.drawImage(video, (detectionCanvas.width - width) / 2, (detectionCanvas.height - height) / 2, width, height)
        detected = false
        try {
          controller.process(detectionCanvas)
          anchor.visible = detected
          if (detected) everFound = true
          status(detected ? 'found' : everFound ? 'lost' : 'searching')
          render()
        } catch { fail(new Error('Se interrumpió el seguimiento. Vuelve a iniciar la cámara o explora sin cámara.')) }
      }
      resize()
      status('searching')
      frame = requestAnimationFrame(tick)
    }

    return {
      dispose,
      rotate(direction) { if (!disposed) { model.rotateY(Math.sign(direction) * Math.PI / 8); render() } },
      setScale(value) { if (!disposed && Number.isFinite(Number(value))) { model.scale.setScalar(THREE.MathUtils.clamp(Number(value), 0.6, 1.6)); render() } },
      reset() {
        if (disposed) return
        model.rotation.set(mode === 'ar' ? Math.PI / 2 : 0, 0, 0)
        model.scale.setScalar(1)
        controls?.reset()
        render()
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
