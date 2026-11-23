// Fit the exported lettering to the glass once, offline. Delivered GLBs stay intact.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { BufferGeometry, BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Matrix4, Raycaster, Vector3 } from 'three'

const require = createRequire(import.meta.resolve('@gltf-transform/cli'))
const { NodeIO } = await import(pathToFileURL(require.resolve('@gltf-transform/core')))
const { ALL_EXTENSIONS } = await import(pathToFileURL(require.resolve('@gltf-transform/extensions')))
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const assets = [
  ['matraz aforado.glb', 'matraz-aforado.glb', 'Cuerpo_Matraz'],
  ['matraz de erlenmeyer.glb', 'matraz-erlenmeyer.glb', 'Cuerpo_Cristal'],
]

export function projectLettering(doc, bodyName) {
  const nodes = doc.getRoot().listNodes()
  const body = nodes.find(node => node.getName() === bodyName)
  if (!body?.getMesh()) throw new Error(`Missing glass: ${bodyName}`)
  const primitive = body.getMesh().listPrimitives()[0]
  const glassGeometry = new BufferGeometry()
  glassGeometry.setAttribute('position', new BufferAttribute(primitive.getAttribute('POSITION').getArray(), 3))
  glassGeometry.setIndex(new BufferAttribute(primitive.getIndices().getArray(), 1))
  const glass = new Mesh(glassGeometry, new MeshBasicMaterial({ side: DoubleSide }))
  glass.matrixAutoUpdate = false
  glass.matrix.fromArray(body.getWorldMatrix())
  glass.updateMatrixWorld(true)
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1))
  const point = new Vector3()
  let vertexCount = 0
  const labels = nodes.filter(node => node.getName().startsWith('Texto_'))
  if (!labels.length) throw new Error('Missing lettering')
  try {
    for (const label of labels) {
      const world = new Matrix4().fromArray(label.getWorldMatrix())
      const inverse = world.clone().invert()
      for (const part of label.getMesh().listPrimitives()) {
        const accessor = part.getAttribute('POSITION')
        const source = accessor.getArray()
        const projected = source.slice()
        let minZ = Infinity, maxZ = -Infinity
        for (let i = 2; i < source.length; i += 3) { minZ = Math.min(minZ, source[i]); maxZ = Math.max(maxZ, source[i]) }
        for (let i = 0; i < source.length; i += 3) {
          point.fromArray(source, i).applyMatrix4(world)
          ray.ray.origin.set(point.x, point.y, 10)
          const hit = ray.intersectObject(glass, false)[0]
          if (!hit) throw new Error(`Letter outside glass: ${label.getName()}, vertex ${i / 3}`)
          // Thin raised ink, with enough clearance to avoid z-fighting.
          const relief = (source[i + 2] - minZ) / Math.max(maxZ - minZ, 1e-8)
          point.z = hit.point.z + 0.0008 + relief * 0.0004
          point.applyMatrix4(inverse).toArray(projected, i)
          vertexCount++
        }
        accessor.setArray(projected)
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new BufferAttribute(projected, 3))
        if (part.getIndices()) geometry.setIndex(new BufferAttribute(part.getIndices().getArray(), 1))
        geometry.computeVertexNormals()
        part.getAttribute('NORMAL').setArray(geometry.getAttribute('normal').array)
        geometry.dispose()
      }
    }
    return { labels: labels.length, vertices: vertexCount }
  } finally {
    glassGeometry.dispose()
    glass.material.dispose()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = []
  await fs.mkdir('public/models/instruments', { recursive: true })
  for (const [source, output, body] of assets) {
    const sourcePath = `public/models/${source}`
    const original = await fs.readFile(sourcePath)
    const doc = await io.read(sourcePath)
    const correction = projectLettering(doc, body)
    const bytes = await io.writeBinary(doc)
    await fs.writeFile(`public/models/instruments/${output}`, bytes)
    if (hash(await fs.readFile(sourcePath)) !== hash(original)) throw new Error('Source changed')
    manifest.push({ source, output, sourceSha256: hash(original), outputSha256: hash(bytes), ...correction })
    console.log(`${output}: ${correction.labels} inscriptions fitted to glass`)
  }
  await fs.writeFile('public/models/instruments/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
}
