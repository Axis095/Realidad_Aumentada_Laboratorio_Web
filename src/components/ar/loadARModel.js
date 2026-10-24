import { Box3, Group, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

// Every AR session owns its model. Nothing is shared with useGLTF's Module 1 cache.
export function releaseARModel(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), bitmaps = new Set(), skeletons = new Set()
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    if (object.skeleton) skeletons.add(object.skeleton)
    for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
      materials.add(material)
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
  })
  textures.forEach(texture => {
    if (texture.source?.data?.close) bitmaps.add(texture.source.data)
    texture.dispose()
  })
  bitmaps.forEach(bitmap => bitmap.close())
  skeletons.forEach(skeleton => skeleton.dispose())
  materials.forEach(material => material.dispose())
  geometries.forEach(geometry => geometry.dispose())
  root.clear()
}

export async function loadARModel(instrument, signal, reduced) {
  let gltf
  try {
    const response = await fetch(instrument.modelUrl, { signal })
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('missing')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength < 20 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) throw new Error('invalid')
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError')
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    gltf = await loader.parseAsync(bytes, new URL('.', new URL(instrument.modelUrl, window.location.origin)).href)
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError')
    const box = new Box3().setFromObject(gltf.scene)
    const size = box.getSize(new Vector3())
    const longest = Math.max(size.x, size.y, size.z)
    if (box.isEmpty() || !Number.isFinite(longest) || longest <= 0) throw new Error('empty')
    // Leave room above the card when the camera points straight down at it.
    // Scaling controls can enlarge the model; this is not physical calibration.
    const factor = 0.7 / longest
    const center = box.getCenter(new Vector3())
    const offset = new Group()
    offset.position.set(-center.x, -box.min.y, -center.z)
    offset.add(gltf.scene)
    const normalized = new Group()
    normalized.scale.setScalar(factor)
    normalized.add(offset)
    const materials = new Set()
    gltf.scene.traverse(object => {
      for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) materials.add(material)
    })
    for (const material of materials) {
      // Physical transmission samples a rendered scene, not the camera video behind
      // our transparent canvas. Use lightweight alpha glass so the card stays visible.
      if (material.transmission > 0) {
        material.transmission = 0
        material.transparent = true
        material.opacity = reduced ? 0.3 : 0.38
        material.depthWrite = false
        material.needsUpdate = true
      }
    }
    return { object: normalized, size: size.multiplyScalar(factor) }
  } catch (error) {
    if (gltf) {
      const allScenes = new Group()
      allScenes.add(...gltf.scenes)
      releaseARModel(allScenes)
    }
    if (error.name === 'AbortError') throw error
    throw new Error(`No se pudo cargar ${instrument.title.toLowerCase()}. Comprueba tu conexión y vuelve a intentarlo, o elige otro instrumento.`)
  }
}
