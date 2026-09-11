import * as THREE from 'three'

// Lightweight, representative demo asset. No external model, textures or lights with shadows.
// Its base is at y=0 so the same model can sit on a marker or a preview pedestal.
export function createDemoBeaker(reduced) {
  const group = new THREE.Group()
  const segments = reduced ? 24 : 40
  const glass = new THREE.MeshPhongMaterial({
    color: '#b8e5eb', transparent: true, opacity: 0.28,
    side: THREE.DoubleSide, depthWrite: false, shininess: 55,
  })
  const rim = new THREE.MeshPhongMaterial({ color: '#70bec9', shininess: 40 })
  const markings = new THREE.MeshBasicMaterial({ color: '#17664d' })
  const liquid = new THREE.MeshPhongMaterial({ color: '#ebae4e', shininess: 25 })

  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.4, 1.12, segments, 1, true), glass)
  wall.position.y = 0.62
  wall.renderOrder = 2
  group.add(wall)
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.07, segments), rim)
  bottom.position.y = 0.055
  group.add(bottom)
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.401, 0.378, 0.5, segments), liquid)
  fluid.position.y = 0.32
  group.add(fluid)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.023, 6, segments), rim)
  lip.rotation.x = Math.PI / 2
  lip.position.y = 1.18
  group.add(lip)
  const spout = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 6, 12, Math.PI), rim)
  spout.rotation.x = Math.PI / 2
  spout.position.set(0.4, 1.18, 0)
  group.add(spout)

  for (let index = 0; index < 6; index++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(index % 2 ? 0.08 : 0.15, 0.014, 0.012), markings)
    tick.position.set(-0.08, 0.22 + index * 0.145, 0.419)
    tick.renderOrder = 3
    group.add(tick)
  }
  return group
}
