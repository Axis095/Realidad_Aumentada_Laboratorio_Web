import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { getModelFrame, measureModel } from '../../utils/modelFraming'
import { loadLearningAsset, releaseLearningObjects } from '../../utils/learningAssets'

export async function createMoleculeViewer({ container, url, title, signal, reduced, onError }) {
  let renderer, controls, observer, gltf, disposed = false
  const lifetime = new AbortController()
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
  let modelSize, homeDistance = 1
  const render = () => { if (!disposed && !document.hidden) renderer.render(scene, camera) }
  const dispose = () => {
    if (disposed) return
    disposed = true
    lifetime.abort()
    signal.removeEventListener('abort', dispose)
    document.removeEventListener('visibilitychange', render)
    observer?.disconnect()
    controls?.dispose()
    renderer?.domElement.removeEventListener('webglcontextlost', lost)
    if (gltf) releaseLearningObjects(gltf.scenes)
    scene.clear()
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove() }
  }
  const lost = event => { event.preventDefault(); dispose(); onError(new Error('Se interrumpió la vista 3D. Puedes reintentar o continuar con el esquema.')) }
  signal.addEventListener('abort', dispose, { once: true })
  try {
    if (signal.aborted) { dispose(); throw new DOMException('Carga cancelada', 'AbortError') }
    const asset = await loadLearningAsset(url, lifetime.signal)
    gltf = asset.gltf
    if (disposed) { releaseLearningObjects(gltf.scenes); throw new DOMException('Carga cancelada', 'AbortError') }
    const measured = measureModel(gltf.scene)
    const offset = new THREE.Group(), model = new THREE.Group()
    offset.position.fromArray(measured.offset)
    offset.add(gltf.scene); model.add(offset); model.scale.setScalar(measured.scale); scene.add(model)
    modelSize = measured.size
    scene.add(new THREE.HemisphereLight('#ffffff', '#839f96', 2.5))
    const light = new THREE.DirectionalLight('#ffffff', 2); light.position.set(2, 4, 5); scene.add(light)
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' })
    renderer.setClearColor('#edf7f1')
    renderer.setPixelRatio(reduced ? 1 : Math.min(devicePixelRatio || 1, 1.35))
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', `Modelo 3D de ${title}. Usa los botones para girar y acercar.`)
    renderer.domElement.addEventListener('webglcontextlost', lost)
    container.appendChild(renderer.domElement)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false; controls.autoRotate = false; controls.enablePan = false
    controls.addEventListener('change', render)
    const fit = () => {
      const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight)
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix()
      const frame = getModelFrame(modelSize, camera.aspect, camera.fov)
      homeDistance = frame.distance
      camera.position.copy(frame.position); controls.target.set(0, 0, 0)
      controls.minDistance = homeDistance * 0.45; controls.maxDistance = homeDistance * 2
      controls.update(); render()
    }
    observer = new ResizeObserver(fit); observer.observe(container)
    document.addEventListener('visibilitychange', render)
    fit()
    return {
      dispose,
      rotate(direction) { if (!disposed) { model.rotation.y += direction * Math.PI / 8; render() } },
      zoom(factor) { if (!disposed) { camera.position.setLength(THREE.MathUtils.clamp(camera.position.length() * factor, controls.minDistance, controls.maxDistance)); controls.update(); render() } },
      reset() { if (!disposed) { model.rotation.set(0, 0, 0); fit() } },
      setQuality(value) { if (!disposed) { renderer.setPixelRatio(value ? 1 : Math.min(devicePixelRatio || 1, 1.35)); renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight)); render() } },
    }
  } catch (error) { dispose(); throw error }
}
