import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { getModelFrame } from '../../utils/modelFraming'
import { getProcessPose, PROCESS_SCENES } from './processPrototypeState'
import { createProcessMeasurements } from './processMeasurements'
import { createProcessFrameLimiter } from './processFrameLimiter'
import { loadLearningAsset, releaseLearningObjects } from '../../utils/learningAssets'

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
export async function createProcessPrototype({ container, signal, reduced = true, initialSceneId = 'fill', allowedSceneIds = PROCESS_SCENES.map(item => item.id), onChange, onError, onStatus = () => {}, startedAt = performance.now(), diagnosticsEnabled = false, onDiagnosticsReady = () => {} }) {
  const lifetime = new AbortController()
  const scene = new THREE.Scene()
  const assets = new THREE.Group()
  let renderer, observer, timer, failure, frame = 0, disposed = false
  let playing = false, progress = 0, sceneId = initialSceneId, lastTime = 0, lastReport = 0
  let qualityReduced = reduced
  let activeAnimation, selectionRequest, selectionVersion = 0, sceneReady = false
  const frameLimiter = createProcessFrameLimiter(reduced ? 20 : 30)
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
    animationSource: activeAnimation ? 'blender' : sceneId === 'fill' ? 'procedural' : null,
    clipName: activeAnimation?.clip.name || null,
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
    selectionRequest?.abort()
    if (activeAnimation) {
      activeAnimation.mixer.stopAllAction()
      activeAnimation.mixer.uncacheRoot(activeAnimation.gltf.scene)
      releaseLearningObjects(activeAnimation.gltf.scenes)
      activeAnimation = null
    }
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
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' })
    renderer.setClearColor('#edf7f1')
    renderer.setPixelRatio(qualityReduced ? 1 : Math.min(devicePixelRatio || 1, 1.35))
    renderer.domElement.setAttribute('aria-label', 'Animación didáctica del proceso de saponificación')
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    container.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight('#ffffff', '#98b9a8', 2.2))
    const light = new THREE.DirectionalLight('#ffffff', 2.5)
    light.position.set(-3, 5, 4)
    scene.add(light)

    const proceduralRoot = new THREE.Group()
    scene.add(proceduralRoot)
    let receiver, fillMetrics
    async function prepareFill() {
      if (receiver) return
      const modelsStartedAt = performance.now()
      const beaker = await load('/models/VasoBlender.glb')
      if (disposed) throw abortError()
      loadMetrics.modelsLoadMs = Math.round(performance.now() - modelsStartedAt)
      const glassTemplate = beaker.getObjectByName('Beaker_250mL')
      const liquidTemplate = beaker.getObjectByName('Liquido_Aceite')
      if (!glassTemplate?.isMesh || !liquidTemplate?.morphTargetInfluences?.length) throw new Error('asset')

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
        proceduralRoot.add(group)
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
      receiver = makeCup('#dca53c')
      const table = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.04, 40), new THREE.MeshLambertMaterial({ color: '#d2e8dc' }))
      table.position.y = -0.035
      proceduralRoot.add(table)
      loadMetrics.readyMs = Math.round(performance.now() - startedAt)
      fillMetrics = { ...loadMetrics, models: [...loadMetrics.models] }
    }

    function applyPose() {
      if (!sceneReady) return
      if (activeAnimation) {
        activeAnimation.action.reset().play()
        activeAnimation.mixer.setTime(progress * activeAnimation.clip.duration)
        return
      }
      const pose = getProcessPose(sceneId, progress)
      receiver.liquid.morphTargetInfluences[0] = pose.receiverLevel
      receiver.liquid.visible = pose.receiverLevel > 0.005
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
      const size = activeAnimation?.bounds.getSize(new THREE.Vector3()) || new THREE.Vector3(1.25, 1.7, 0.85)
      const center = activeAnimation?.bounds.getCenter(new THREE.Vector3()) || new THREE.Vector3(0, 0.65, 0)
      camera.position.copy(getModelFrame(size, camera.aspect, camera.fov).position).add(center)
      camera.lookAt(center)
      camera.updateProjectionMatrix()
      render()
    }
    const tick = now => {
      if (!playing || disposed || !sceneReady) return
      const duration = activeAnimation?.clip.duration || PROCESS_SCENES.find(item => item.id === sceneId).duration
      progress = Math.min(1, progress + Math.min((now - lastTime) / 1000, 0.1) / duration)
      lastTime = now
      if (frameLimiter.shouldRender(now) || progress >= 1) {
        render(true)
      }
      if (progress >= 1) cancelPlayback()
      if (now - lastReport >= 250 || !playing) { publish(); lastReport = now }
      if (playing) frame = requestAnimationFrame(tick)
    }
    observer = new ResizeObserver(resize)
    observer.observe(container)
    async function select(id) {
      const next = PROCESS_SCENES.find(item => item.id === id)
      if (disposed || !next || !allowedSceneIds.includes(id)) return
      const version = ++selectionVersion, selectionStarted = performance.now()
      selectionRequest?.abort()
      selectionRequest = new AbortController()
      cancelPlayback(); measurements.reset(); sceneReady = false; failure = null
      if (activeAnimation) {
        activeAnimation.mixer.stopAllAction()
        activeAnimation.mixer.uncacheRoot(activeAnimation.gltf.scene)
        releaseLearningObjects(activeAnimation.gltf.scenes)
        activeAnimation = null
      }
      sceneId = id; progress = 0; proceduralRoot.visible = false
      renderer.domElement.setAttribute('aria-label', `Animación didáctica: ${next.title}`)
      Object.assign(loadMetrics, { readyMs: null, modelsLoadMs: null, models: [] })
      onStatus('loading'); publish(); render()
      if (id === 'fill') {
        try { await prepareFill() } catch (error) { fail(new Error('No pudimos preparar los modelos del prototipo. Reintenta o continúa con la explicación sin 3D.')); return }
        if (disposed || version !== selectionVersion) return
        Object.assign(loadMetrics, fillMetrics)
        proceduralRoot.visible = true; sceneReady = true; resize(); onStatus('ready'); publish()
        return
      }
      try {
        const result = await loadLearningAsset(next.modelUrl, selectionRequest.signal)
        if (disposed || version !== selectionVersion) { releaseLearningObjects(result.gltf.scenes); return }
        const { gltf } = result, clip = gltf.animations[0]
        if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0) {
          releaseLearningObjects(gltf.scenes)
          throw new Error('La escena no contiene una animación válida.')
        }
        const mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true
        const bounds = new THREE.Box3()
        activeAnimation = { gltf, clip, mixer, action, bounds }
        gltf.scene.traverse(object => {
          for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
            // These schematic liquids need both faces, but not two transparent passes.
            if (material.transparent) material.forceSinglePass = true
          }
        })
        scene.add(gltf.scene)
        // Fit the whole motion, including the lifted pouring vessel and rod.
        for (const fraction of [0, .25, .5, .75, 1]) {
          action.reset().play(); mixer.setTime(fraction * clip.duration)
          gltf.scene.updateMatrixWorld(true)
          bounds.union(new THREE.Box3().setFromObject(gltf.scene, true))
        }
        if (bounds.isEmpty()) throw new Error('La escena no contiene geometría visible.')
        loadMetrics.models = [{ url: result.url, bytes: result.bytes, loadMs: result.loadMs }]
        loadMetrics.modelsLoadMs = result.loadMs
        sceneReady = true; resize()
        loadMetrics.readyMs = Math.round(performance.now() - (version === 1 ? startedAt : selectionStarted))
        onStatus('ready'); publish()
      } catch (error) {
        if (disposed || version !== selectionVersion) return
        if (activeAnimation) {
          activeAnimation.mixer.stopAllAction(); activeAnimation.mixer.uncacheRoot(activeAnimation.gltf.scene)
          releaseLearningObjects(activeAnimation.gltf.scenes); activeAnimation = null
        }
        sceneReady = false
        failure = new Error('No pudimos preparar esta animación. Reintenta o elige otra escena.')
        onStatus('error'); onError(failure); publish()
      }
    }
    await select(initialSceneId)
    clearTimeout(timer)
    if (disposed) throw failure || abortError()
    publish()
    return {
      dispose,
      play() {
        if (disposed || playing || !sceneReady) return
        if (progress >= 1) progress = 0
        playing = true
        measurements.setPlaying(true)
        lastTime = performance.now()
        frameLimiter.reset(lastTime, qualityReduced ? 20 : 30)
        lastReport = 0
        publish()
        frame = requestAnimationFrame(tick)
      },
      pause() { if (!disposed && sceneReady) { cancelPlayback(); render(); publish() } },
      reset() { if (!disposed && sceneReady) { cancelPlayback(); measurements.reset(); progress = 0; render(); publish() } },
      seek(value) { if (!disposed && sceneReady) { cancelPlayback(); progress = getProcessPose(sceneId, Number(value)).progress; render(); publish() } },
      select,
      setQuality(value) {
        if (disposed) return
        if (qualityReduced !== value) {
          measurements.reset()
          frameLimiter.reset(performance.now(), value ? 20 : 30)
        }
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
