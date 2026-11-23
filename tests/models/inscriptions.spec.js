import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Raycaster, Vector3 } from 'three'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function load(bytes) {
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene
}

test('flask inscriptions follow the glass without changing originals or other geometry', async () => {
  const manifest = JSON.parse(await fs.readFile('public/models/instruments/manifest.json', 'utf8'))
  expect(manifest).toHaveLength(2)
  for (const entry of manifest) {
    const original = await fs.readFile(`public/models/${entry.source}`)
    const corrected = await fs.readFile(`public/models/instruments/${entry.output}`)
    expect(sha(original)).toBe(entry.sourceSha256)
    expect(sha(corrected)).toBe(entry.outputSha256)
    const sourceScene = await load(original)
    const scene = await load(corrected)
    scene.updateMatrixWorld(true)
    const body = scene.getObjectByName(entry.output === 'matraz-aforado.glb' ? 'Cuerpo_Matraz' : 'Cuerpo_Cristal')
    const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1))
    const point = new Vector3()
    let labels = 0
    scene.traverse(node => {
      if (!node.isMesh) return
      const position = node.geometry.getAttribute('position')
      const sourceNode = sourceScene.getObjectByName(node.name)
      expect(node.matrix.elements).toEqual(sourceNode.matrix.elements)
      expect(position.count).toBe(sourceNode.geometry.getAttribute('position').count)
      if (!node.name.startsWith('Texto_')) {
        // NodeIO interleaves output buffers; compare positions rather than raw storage.
        const sourcePosition = sourceNode.geometry.getAttribute('position')
        for (let i = 0; i < position.count; i++) {
          expect(new Vector3().fromBufferAttribute(position, i).toArray())
            .toEqual(new Vector3().fromBufferAttribute(sourcePosition, i).toArray())
        }
        return
      }
      labels++
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld)
        ray.ray.origin.set(point.x, point.y, 10)
        const hit = ray.intersectObject(body, false)[0]
        expect(hit).toBeTruthy()
        const clearance = point.z - hit.point.z
        expect(clearance).toBeGreaterThan(0.00079)
        expect(clearance).toBeLessThan(0.00121)
      }
    })
    expect(labels).toBe(entry.labels)
  }
})
