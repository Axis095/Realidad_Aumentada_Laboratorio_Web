// Generate web copies; never overwrite delivered GLBs. Uses the installed CLI toolchain.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
const require = createRequire(import.meta.resolve('@gltf-transform/cli'))
const { NodeIO } = await import(pathToFileURL(require.resolve('@gltf-transform/core')))
const { ALL_EXTENSIONS } = await import(pathToFileURL(require.resolve('@gltf-transform/extensions')))
const { dedup, prune, join, instance, resample, weld, simplify } = await import(pathToFileURL(require.resolve('@gltf-transform/functions')))
const { MeshoptSimplifier } = await import(pathToFileURL(require.resolve('meshoptimizer')))
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const assets = [
  ['molecules/HidroxidoDeSodio.glb', 'naoh.glb', 'molecule'],
  ['molecules/Gliserol.glb', 'glicerol.glb', 'molecule'],
  ['process/MezclaAceiteAguaEscena6.glb', 'vertido.glb', 'process'],
  ['process/MezclaEscena7.glb', 'agitacion.glb', 'process'],
  ['process/MedicionAguaEscena4.glb', 'medicion-agua.glb', 'process'],
  ['process/DisolucionNaOHTermometroEscena.glb5.glb', 'disolucion.glb', 'process'],
  ['process/EmulsionEscena8.glb', 'emulsion.glb', 'process'],
  ['process/MoldesEscena9-10.glb', 'moldeo.glb', 'process'],
]
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const manifest = []
await fs.mkdir('public/models/optimized', { recursive: true })
for (const [source, output, type] of assets) {
  const sourcePath = `public/models/${source}`
  const original = await fs.readFile(sourcePath)
  const doc = await io.read(sourcePath)
  const root = doc.getRoot()
  if (type === 'process') {
    const targets = new Set(root.listAnimations().flatMap(a => a.listChannels().map(c => c.getTargetNode())))
    for (const node of root.listNodes()) {
      // Extruded numerals dominate triangle count. Keep the graduation strokes.
      // These original oil remnants are unused by the delivered animation.
      if (/_Label_|_Text_/.test(node.getName()) || ['Escena06_Liquido_Aceite', 'E07_Liquido_Aceite', 'E04_Vaso_Liquido_Aceite', 'E05_Vaso_Liquido_Aceite', 'E08_Liquido_Aceite'].includes(node.getName())) {
        if (targets.has(node)) throw new Error(`Refusing to remove animated node: ${node.getName()}`)
        node.dispose()
      }
    }
    for (const material of root.listMaterials()) {
      const glass = /Glass|Cristal/i.test(material.getName()) || material.getExtension('KHR_materials_transmission')
      for (const extension of [...material.listExtensions()]) extension.dispose()
      if (glass) material.setBaseColorFactor([0.65, 0.84, 0.84, 0.24]).setAlphaMode('BLEND').setDoubleSided(false)
      // Keep the thin stirring rod legible on a phone without physical refraction.
      if (material.getName() === 'E07_Glass_Grey') material.setBaseColorFactor([0.18, 0.43, 0.46, 0.85])
    }
    await doc.transform(dedup(), join({ filter: node => /_Graduation_|_Marca_|^Cavidad_/.test(node.getName()) && !targets.has(node) }), resample(), prune())
    if (['medicion-agua.glb', 'disolucion.glb', 'emulsion.glb', 'moldeo.glb'].includes(output)) {
      // Offline simplification: no decoder or extra runtime dependency on students' phones.
      await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.002 }), prune())
    }
  } else {
    // Preserve spheres/bonds and their colors, reducing repeated meshes to instances.
    await doc.transform(dedup(), instance({ min: 2 }), prune())
  }
  const bytes = await io.writeBinary(doc)
  await fs.writeFile(`public/models/optimized/${output}`, bytes)
  if (hash(await fs.readFile(sourcePath)) !== hash(original)) throw new Error('Source changed during preparation')
  const entry = { source, output, sourceSha256: hash(original), outputSha256: hash(bytes), sourceBytes: original.length, outputBytes: bytes.length }
  manifest.push(entry)
  console.log(`${output}: ${original.length} -> ${bytes.length} bytes`)
}
await fs.writeFile('public/models/optimized/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
