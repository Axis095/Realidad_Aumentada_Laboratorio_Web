import { Box3, Vector3 } from 'three'

// Normalize presentation, not the cached GLTF or the instrument's real-world units.
export function measureModel(scene) {
  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const longest = Math.max(size.x, size.y, size.z)
  if (box.isEmpty() || !Number.isFinite(longest) || longest <= 0) {
    throw new Error('El modelo no contiene geometría visible válida.')
  }
  const scale = 2.6 / longest
  return {
    scale,
    offset: box.getCenter(new Vector3()).multiplyScalar(-1).toArray(),
    size: size.multiplyScalar(scale),
  }
}

// Fit all eight corners, accounting for depth, portrait viewports and UI margins.
export function getModelFrame(size, aspect, fov = 45) {
  const direction = new Vector3(0, 0.28, 1).normalize()
  const right = new Vector3(1, 0, 0)
  const up = new Vector3().crossVectors(direction, right)
  const tanVertical = Math.tan(fov * Math.PI / 360) * 0.74
  const tanHorizontal = Math.tan(fov * Math.PI / 360) * Math.max(aspect, 0.1) * 0.68
  let distance = 0
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const corner = new Vector3(x * size.x / 2, y * size.y / 2, z * size.z / 2)
    const depth = corner.dot(direction)
    distance = Math.max(distance,
      depth + Math.abs(corner.dot(right)) / tanHorizontal,
      depth + Math.abs(corner.dot(up)) / tanVertical)
  }
  return { position: direction.multiplyScalar(distance), distance }
}
