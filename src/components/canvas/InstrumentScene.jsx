import React, { Component, Suspense, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Clone, ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { getModelFrame, measureModel } from '../../utils/modelFraming'

class ViewerBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch(error) { this.props.onError?.(error) }

  componentDidUpdate(previous) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() { return this.state.failed ? null : this.props.children }
}

function FittedModel({ url, reducedPerformance, onReady }) {
  const { scene } = useGLTF(url)
  const measurement = useMemo(() => measureModel(scene), [scene])
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    const { position, distance } = getModelFrame(measurement.size, width / Math.max(1, height), camera.fov)
    camera.position.copy(position)
    camera.near = 0.01
    camera.far = Math.max(100, distance * 10)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.minDistance = Math.max(0.3, measurement.size.length() * 0.3)
      controls.maxDistance = distance * 4
      controls.update()
      controls.saveState()
    }
    invalidate()
    onReady()
  }, [measurement, camera, controls, width, height, invalidate, onReady])

  return (
    <>
      <group scale={measurement.scale}>
        <group position={measurement.offset}>
          {/* Preserve the cached template across model changes and route remounts. */}
          <Clone object={scene} deep />
        </group>
      </group>
      {!reducedPerformance && <ContactShadows position={[0, -measurement.size.y / 2 - 0.02, 0]} opacity={0.3} scale={6} blur={2} frames={1} resolution={256} />}
    </>
  )
}

export default function InstrumentScene({ model, reducedPerformance }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const resetKey = `${model.url}:${attempt}`
  const status = result?.key === resetKey ? result.status : 'loading'
  const onReady = useCallback(() => {
    setResult((previous) => previous?.key === resetKey && previous.status === 'ready'
      ? previous : { key: resetKey, status: 'ready' })
  }, [resetKey])
  const onError = useCallback(() => setResult({ key: resetKey, status: 'error' }), [resetKey])
  const retry = () => {
    // Suspense caches rejected loads too. Clear only this asset before retrying.
    useGLTF.clear(model.url)
    setAttempt((value) => value + 1)
  }

  return (
    <div className="m1-scene" data-model-status={status} data-model-id={model.id} aria-busy={status === 'loading'}>
      {/* Catch renderer initialization failures without unmounting the module UI. */}
      <ViewerBoundary resetKey={resetKey} onError={onError}>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }} dpr={reducedPerformance ? 1 : [1, 1.35]}
          frameloop="demand" gl={{ antialias: false, powerPreference: 'low-power' }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-4, 2, -4]} intensity={0.3} color="#3974d8" />
          <OrbitControls makeDefault enableZoom enablePan={false} enableDamping={false} />
          {/* Keep the same WebGL context even when a GLTF fails or changes. */}
          <ViewerBoundary resetKey={resetKey} onError={onError}>
            <Suspense fallback={null}>
              <FittedModel key={resetKey} url={model.url} reducedPerformance={reducedPerformance} onReady={onReady} />
            </Suspense>
          </ViewerBoundary>
          {/* Optional remote lighting must never block the instrument itself. */}
          {!reducedPerformance && <ViewerBoundary resetKey="environment">
            <Suspense fallback={null}><Environment preset="studio" /></Suspense>
          </ViewerBoundary>}
        </Canvas>
      </ViewerBoundary>
      {status === 'loading' && <div className="m1-model-loading" role="status">
        <span className="m1-model-spinner" aria-hidden="true" />Cargando instrumento…
      </div>}
      {status === 'error' && <div className="m1-model-error" role="alert">
        <strong>No se pudo mostrar {model.label.toLowerCase()}.</strong>
        <p>Comprueba tu conexión y vuelve a intentarlo. También puedes seleccionar otro instrumento sin salir del módulo.</p>
        <button type="button" onClick={retry}>Reintentar modelo</button>
      </div>}
    </div>
  )
}
