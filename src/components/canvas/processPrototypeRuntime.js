import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { getModelFrame } from '../../utils/modelFraming'
import { getProcessPose, PROCESS_SCENES } from './processPrototypeState'
import { createProcessMeasurements } from './processMeasurements'

const abortError = () => new DOMException('Prototipo cancelado', 'AbortError')

function disposeObjects(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  roots.forEach(root => root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
      materials.add(material)
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) })
    }
  }))
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach(texture => { texture.dispose(); texture.source?.data?.close?.() })
  roots.forEach(root => root.clear())
}

// Own fresh GLTF instances. Never mutate useGLTF's Module 1 cache or the AR scene.
export async function createProcessPrototype({ container, signal, reduced = true, onChange, onError, startedAt = performance.now(), diagnosticsEnabled = false, onDiagnosticsReady = () => {} }) {
  const lifetime = new AbortController()
  const scene = new THREE.Scene()
  const assets = new THREE.Group()
  let renderer, observer, timer, failure, frame = 0, disposed = false
  let playing = false, progress = 0, sceneId = 'fill', lastTime = 0, lastRender = 0, lastReport = 0
  let qualityReduced = reduced
  let renderCount = 0
  const measurements = createProcessMeasurements()
  measurements.setEnabled(diagnosticsEnabled)
  const loadMetrics = { readyMs: null, modelsLoadMs: null, models: [] }
  let finalDiagnostics = null
  const getDiagnostics = () => finalDiagnostics || {
    sceneId, sceneTitle: PROCESS_SCENES.find(item => item.id === sceneId).title,
    progress: Math.round(progress * 100), running: !disposed,
    state: failure ? 'error' : loadMetrics.readyMs === null ? 'loading' : playing ? 'playing' : progress >= 1 ? 'completed' : 'paused',
    profile: qualityReduced ? 'reduced' : 'full', targetFps: qualityReduced ? 20 : 30,
    measurement: measurements.snapshot(),
    readyMs: loadMetrics.readyMs, modelsLoadMs: loadMetrics.modelsLoadMs,
    models: loadMetrics.models.map(model => ({ ...model })),
    modelBytes: loadMetrics.models.length ? loadMetrics.models.reduce((sum, model) => sum + model.bytes, 0) : null,
    renderResolution: renderer ? `${renderer.domElement.width} × ${renderer.domElement.height}` : null,
    pixelRatio: renderer?.getPixelRatio() ?? null,
    drawCalls: renderer?.info.render.calls ?? null, triangles: renderer?.info.render.triangles ?? null,
    geometries: renderer?.info.memory.geometries ?? null, textures: renderer?.info.memory.textures ?? null,
    error: failure?.message || null,
  }
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
  const publish = () => { if (!disposed) onChange({ sceneId, progress, playing, renderCount, completed: progress >= 1 }) }
  const cancelPlayback = () => { measurements.setPlaying(false); playing = false; cancelAnimationFrame(frame); frame = 0 }
  const dispose = () => {
    if (disposed) return
    cancelPlayback()
    finalDiagnostics = { ...getDiagnostics(), running: false, state: failure ? 'error' : 'closed' }
    measurements.setEnabled(false)
    disposed = true
    lifetime.abort()
    signal.removeEventListener('abort', dispose)
    clearTimeout(timer)
    cancelPlayback()
    observer?.disconnect()
    renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
    disposeObjects([scene, assets])
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); renderer = null }
  }
  const fail = error => { if (!disposed) { failure = error; dispose(); onError(error) } }
  const contextLost = event => { event.preventDefault(); fail(new Error('La vista 3D perdió el contexto gráfico. Puedes reintentar o continuar con la explicación sin 3D.')) }
  signal.addEventListener('abort', dispose, { once: true })
  onDiagnosticsReady({
    getSnapshot: getDiagnostics,
    setEnabled(value) { if (!disposed) measurements.setEnabled(value) },
  })

  async function load(url) {
    const loadStartedAt = performance.now()
    const response = await fetch(url, { signal: lifetime.signal })
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('asset')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength < 20 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) throw new Error('asset')
    if (disposed) throw abortError()
    const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', new URL(url, location.origin)).href)
    if (disposed) { disposeObjects(gltf.scenes); throw abortError() }
    assets.add(...gltf.scenes)
    loadMetrics.models.push({ url, bytes: bytes.byteLength, loadMs: Math.round(performance.now() - loadStartedAt) })
    return gltf.scene
  }

  try {
    if (signal.aborted) { dispose(); throw abortError() }
    timer = setTimeout(() => fail(new Error('La carga tardó demasiado. Revisa tu conexión o continúa con la explicación sin 3D.')), 30000)
    const modelsStartedAt = performance.now()
    const [beaker, stirrer] = await Promise.all([load('/models/VasoBlender.glb'), load('/models/AgitadorVidrio.glb')])
    if (disposed) throw abortError()
    loadMetrics.modelsLoadMs = Math.round(performance.now() - modelsStartedAt)
    clearTimeout(timer)
    const glassTemplate = beaker.getObjectByName('Beaker_250mL')
    const liquidTemplate = beaker.getObjectByName('Liquido_Aceite')
    const rodTemplate = stirrer.getObjectByName('Agitador_Cristal')
    if (!glassTemplate?.isMesh || !liquidTemplate?.morphTargetInfluences?.length || !rodTemplate?.isMesh) throw new Error('asset')

    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' })
    renderer.setClearColor('#edf7f1')
    renderer.setPixelRatio(qualityReduced ? 1 : Math.min(devicePixelRatio || 1, 1.35))
    renderer.domElement.setAttribute('aria-label', 'Animación didáctica de llenado, vertido y agitación')
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    container.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight('#ffffff', '#98b9a8', 2.2))
    const light = new THREE.DirectionalLight('#ffffff', 2.5)
    light.position.set(-3, 5, 4)
    scene.add(light)

    // Omit expensive extruded numeric labels in this illustrative, uncalibrated view.
    // Merge only the static graduation strokes; never merge the moving liquid.
    beaker.updateMatrixWorld(true)
    const marks = []
    beaker.traverse(object => {
      if (!object.isMesh || !object.name.startsWith('Graduation_')) return
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
      for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal'].includes(name)) geometry.deleteAttribute(name)
      geometry.applyMatrix4(object.matrixWorld)
      marks.push(geometry)
    })
    const markings = marks.length ? mergeGeometries(marks) : null
    marks.forEach(geometry => geometry.dispose())
    if (!markings) throw new Error('asset')
    const glassMaterial = new THREE.MeshPhongMaterial({ color: '#a6d6d7', transparent: true, opacity: 0.24, depthWrite: false, shininess: 55 })
    const markMaterial = new THREE.MeshBasicMaterial({ color: '#527675' })
    const glassGeometry = glassTemplate.geometry.clone().applyMatrix4(glassTemplate.matrixWorld)

    function makeCup(color) {
      const group = new THREE.Group()
      scene.add(group)
      group.add(new THREE.Mesh(glassGeometry, glassMaterial), new THREE.Mesh(markings, markMaterial))
      const liquid = liquidTemplate.clone()
      liquid.material = new THREE.MeshPhongMaterial({ color, shininess: 25 })
      // The supplied liquid is ~10x smaller than the beaker. Fit its original morph
      // geometry in this scene only, leaving the file and cached assets untouched.
      liquid.scale.set(9.5, 11.5, 9.5)
      liquid.position.set(0, 0.045, 0)
      liquid.morphTargetInfluences[0] = 0
      liquid.renderOrder = 0
      group.add(liquid)
      return { group, liquid }
    }
    const receiver = makeCup('#dca53c')
    const donor = makeCup('#86bbd6')
    const donorPivot = new THREE.Group()
    scene.add(donorPivot)
    donorPivot.add(donor.group)
    donor.group.rotation.y = Math.PI // Turn the spout toward the receiving vessel.
    donor.group.scale.setScalar(0.72)

    const rod = rodTemplate.clone()
    rod.material = new THREE.MeshPhongMaterial({ color: '#5a9fa5', shininess: 65 })
    rod.position.set(0, 0, 0)
    // Geometry is centered around zero; place its lower end inside the mixture.
    rod.scale.setScalar(0.59)
    scene.add(rod)

    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.026, 1, 8), new THREE.MeshBasicMaterial({ color: '#86bbd6' }))
    scene.add(stream)
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 4, 24, Math.PI * 1.55), new THREE.MeshBasicMaterial({ color: '#f8d77a' }))
    swirl.rotation.x = Math.PI / 2
    scene.add(swirl)
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.04, 40), new THREE.MeshLambertMaterial({ color: '#d2e8dc' }))
    table.position.y = -0.035
    scene.add(table)

    const oilColor = new THREE.Color('#dca53c'), mixedColor = new THREE.Color('#edc86e')
    const spout = new THREE.Vector3(), target = new THREE.Vector3(), direction = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    function applyPose() {
      const pose = getProcessPose(sceneId, progress)
      receiver.group.position.x = sceneId === 'pour' ? 0.47 : 0
      receiver.liquid.morphTargetInfluences[0] = pose.receiverLevel
      receiver.liquid.visible = pose.receiverLevel > 0.005
      receiver.liquid.material.color.copy(oilColor).lerp(mixedColor, pose.mixed)
      donorPivot.visible = sceneId === 'pour'
      donorPivot.position.set(-0.83, 0.07 + 1.22 * pose.donorLift, 0)
      donorPivot.rotation.z = -pose.tilt
      donor.liquid.morphTargetInfluences[0] = pose.donorLevel
      donor.liquid.visible = pose.donorLevel > 0.005
      stream.visible = pose.stream
      if (pose.stream) {
        donor.group.updateWorldMatrix(true, false)
        spout.set(-0.39, 0.95, 0).applyMatrix4(donor.group.matrixWorld)
        target.set(receiver.group.position.x, 0.06 + pose.receiverLevel * 0.585, 0)
        direction.subVectors(target, spout)
        stream.position.copy(spout).add(target).multiplyScalar(0.5)
        stream.scale.y = direction.length()
        stream.quaternion.setFromUnitVectors(up, direction.normalize())
      }
      rod.visible = sceneId === 'stir'
      rod.position.set(Math.cos(pose.stirAngle) * 0.14, 0.79, Math.sin(pose.stirAngle) * 0.14)
      rod.rotation.set(0.07 * Math.sin(pose.stirAngle), 0, 0.07 * Math.cos(pose.stirAngle))
      swirl.visible = sceneId === 'stir'
      swirl.position.set(0, 0.045 + 0.9 * 0.585 + 0.009, 0)
      swirl.rotation.z = -pose.stirAngle
    }
    function render(animationFrame = false) {
      if (disposed) return
      const measurementStart = animationFrame ? measurements.begin() : null
      applyPose()
      renderer.render(scene, camera)
      if (animationFrame) measurements.end(measurementStart)
      renderCount += 1
    }
    function resize() {
      if (disposed) return
      const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1)
      renderer.setSize(width, height)
      camera.aspect = width / height
      const size = sceneId === 'pour' ? new THREE.Vector3(2.5, 2.25, 1) : new THREE.Vector3(1.25, 1.7, 0.85)
      const center = new THREE.Vector3(0, sceneId === 'pour' ? 1 : 0.65, 0)
      camera.position.copy(getModelFrame(size, camera.aspect, camera.fov).position).add(center)
      camera.lookAt(center)
      camera.updateProjectionMatrix()
      render()
    }
    const tick = now => {
      if (!playing || disposed) return
      progress = Math.min(1, progress + Math.min((now - lastTime) / 1000, 0.1) / PROCESS_SCENES.find(item => item.id === sceneId).duration)
      lastTime = now
      if (now - lastRender >= 1000 / (qualityReduced ? 20 : 30) || progress >= 1) {
        render(true)
        lastRender = now
      }
      if (progress >= 1) cancelPlayback()
      if (now - lastReport >= 250 || !playing) { publish(); lastReport = now }
      if (playing) frame = requestAnimationFrame(tick)
    }
    observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    loadMetrics.readyMs = Math.round(performance.now() - startedAt)
    publish()
    return {
      dispose,
      play() {
        if (disposed || playing) return
        if (progress >= 1) progress = 0
        playing = true
        measurements.setPlaying(true)
        lastTime = performance.now()
        lastRender = lastReport = 0
        publish()
        frame = requestAnimationFrame(tick)
      },
      pause() { if (!disposed) { cancelPlayback(); render(); publish() } },
      reset() { if (!disposed) { cancelPlayback(); measurements.reset(); progress = 0; render(); publish() } },
      seek(value) { if (!disposed) { cancelPlayback(); progress = getProcessPose(sceneId, Number(value)).progress; render(); publish() } },
      select(id) {
        if (disposed || !PROCESS_SCENES.some(item => item.id === id)) return
        cancelPlayback(); measurements.reset(); sceneId = id; progress = 0; resize(); publish()
      },
      setQuality(value) {
        if (disposed) return
        if (qualityReduced !== value) measurements.reset()
        qualityReduced = value
        renderer.setPixelRatio(value ? 1 : Math.min(devicePixelRatio || 1, 1.35))
        resize()
      },
    }
  } catch (error) {
    if (!failure && error.name !== 'AbortError') failure = new Error('No pudimos preparar los modelos del prototipo. Reintenta o continúa con la explicación sin 3D.')
    dispose()
    if (failure) throw failure
    if (error.name === 'AbortError') throw error
    throw new Error('No pudimos preparar los modelos del prototipo. Reintenta o continúa con la explicación sin 3D.')
  }
}
