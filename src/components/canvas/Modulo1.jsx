import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

function BeakerModel() {
  const { scene } = useGLTF('/models/beaker.glb')
  return <primitive object={scene} scale={0.5} position={[0, -1, 0]} />
}

function VisorBeaker() {
  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <BeakerModel />
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={6} blur={2} />
        </Suspense>
        <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  )
}

export default function Modulo1() {
  return (
    <ModuloBase
      num="1"
      color="#4f8eff"
      icon="🧪"
      titulo="Reconocimiento de material de laboratorio"
      subtitulo="Identifica los instrumentos necesarios para realizar la reacción de saponificación."
      objetivo="Identificar el material de laboratorio necesario para realizar la reacción de saponificación utilizada en la elaboración de jabones ecológicos."
      contenido={
        <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Vaso de precipitados ✓</li>
          <li>Probeta graduada</li>
          <li>Balanza analítica</li>
          <li>Termómetro</li>
          <li>Varilla de agitación</li>
          <li>Moldes para jabón</li>
        </ul>
      }
      instruccion="Arrastra para rotar el modelo. Usa la rueda del mouse para hacer zoom. El modelo rota automáticamente."
      prevPath={null}
      nextPath="/modulo/2"
    >
      <VisorBeaker />
    </ModuloBase>
  )
}

useGLTF.preload('/models/beaker.glb')