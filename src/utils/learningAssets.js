import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function releaseLearningObjects(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  roots.forEach(root => root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
      materials.add(material)
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) })
    }
    if (object.isInstancedMesh) object.dispose()
  }))
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach(texture => { texture.dispose(); texture.source?.data?.close?.() })
  roots.forEach(root => { root.removeFromParent(); root.clear() })
}

export async function loadLearningAsset(url, signal) {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) cancel()
  let timedOut = false, gltf
  const timer = setTimeout(() => { timedOut = true; cancel() }, 30000)
  const started = performance.now()
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('No se pudo descargar el modelo.')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength < 20 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) throw new Error('El archivo 3D no es válido.')
    if (controller.signal.aborted) throw new DOMException('Carga cancelada', 'AbortError')
    gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', new URL(url, location.origin)).href)
    if (controller.signal.aborted) throw new DOMException('Carga cancelada', 'AbortError')
    return { gltf, url, bytes: bytes.byteLength, loadMs: Math.round(performance.now() - started) }
  } catch (error) {
    if (gltf) releaseLearningObjects(gltf.scenes)
    if (timedOut) throw new Error('La carga tardó demasiado. Revisa la conexión y vuelve a intentarlo.')
    throw error
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
  }
}
