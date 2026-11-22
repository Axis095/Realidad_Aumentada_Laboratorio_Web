import React, { useEffect, useRef, useState } from 'react'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import './MoleculeViewer.css'

export default function MoleculeViewer({ molecule, children }) {
  const [enabled, setEnabled] = useState(false), [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('idle'), [error, setError] = useState('')
  const container = useRef(null), runtime = useRef(null)
  const { profile } = usePerformanceProfile()
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile; runtime.current?.setQuality(profile === 'reduced') }, [profile])
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let viewer
    setStatus('loading'); setError('')
    const fail = failure => { if (!controller.signal.aborted) { setError(failure.message); setStatus('error') } }
    async function start() {
      try {
        const { createMoleculeViewer } = await import('./moleculeRuntime')
        if (controller.signal.aborted) return
        viewer = await createMoleculeViewer({ container: container.current, url: molecule.modelUrl, title: molecule.name, signal: controller.signal, reduced: profileRef.current === 'reduced', onError: fail })
        if (controller.signal.aborted) { viewer.dispose(); return }
        runtime.current = viewer; viewer.setQuality(profileRef.current === 'reduced'); setStatus('ready')
      } catch (failure) { fail(failure) }
    }
    start()
    return () => { controller.abort(); viewer?.dispose(); runtime.current = null }
  }, [enabled, attempt, molecule.modelUrl, molecule.name])
  if (!molecule.modelUrl) return children
  const ready = status === 'ready'
  return <div className="molecule-viewer">
    {!enabled ? <>{children}<button type="button" onClick={() => setEnabled(true)}>Explorar {molecule.name} en 3D</button>
      <p>Vista opcional. Arrastra para girar o usa los botones.</p></> : <>
      <div className="molecule-viewer-stage" data-status={status}>
        <div className="molecule-viewer-canvas" ref={container} />
        {status === 'loading' && <p role="status">Preparando molécula…</p>}
        {error && <div className="molecule-viewer-error"><p role="alert">{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Reintentar molécula</button></div>}
      </div>
      <div className="molecule-viewer-controls" role="group" aria-label="Controles de la molécula">
        <button type="button" disabled={!ready} aria-label="Girar a la izquierda" onClick={() => runtime.current?.rotate(-1)}>↶</button>
        <button type="button" disabled={!ready} aria-label="Girar a la derecha" onClick={() => runtime.current?.rotate(1)}>↷</button>
        <button type="button" disabled={!ready} aria-label="Acercar molécula" onClick={() => runtime.current?.zoom(0.85)}>+</button>
        <button type="button" disabled={!ready} aria-label="Alejar molécula" onClick={() => runtime.current?.zoom(1.15)}>−</button>
        <button type="button" disabled={!ready} onClick={() => runtime.current?.reset()}>Centrar</button>
      </div>
      <button type="button" onClick={() => { setEnabled(false); setStatus('idle'); setError('') }}>Volver al esquema</button>
      <p>{molecule.id === 'naoh' ? 'Na⁺ y OH⁻ se muestran separados: representan los iones en solución.' : 'Localiza los tres oxígenos rojos y sus grupos OH.'} La vista permanece quieta hasta que interactúas.</p>
    </>}
  </div>
}
