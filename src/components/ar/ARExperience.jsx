import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import { AR_DEMO } from './arDemoConfig'
import './ARExperience.css'

function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 5l1-2h6l1 2h3a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /><circle cx="12" cy="12" r="4" /></svg>
}

function BeakerIllustration() {
  return (
    <svg className="ar-demo-illustration" viewBox="0 0 320 280" fill="none" aria-hidden="true">
      <ellipse cx="158" cy="246" rx="93" ry="14" fill="#d2e8de" />
      <path d="M51 219l109-27 111 26-111 34z" fill="white" stroke="#bedbce" strokeWidth="2" />
      <path d="M85 219l75-18 77 17-77 23z" fill="#183b3a" />
      <path d="M116 218l44-10 44 10-44 13z" fill="white" />
      <path d="M99 68h119l-16 20v128c0 17-101 17-101 0V88z" fill="#f7fffc" stroke="#218c68" strokeWidth="4" strokeLinejoin="round" />
      <path d="M104 153c27 12 67-13 95 0v62c0 13-95 13-95 0z" fill="#a6deca" />
      <path d="M105 153c25 11 67-12 93 0" stroke="#218c68" strokeWidth="2" />
      <path d="M112 79h85M172 106h20m-12 17h12m-20 17h20m-12 17h12m-20 17h20m-12 17h12" stroke="#3974d8" strokeWidth="3" strokeLinecap="round" />
      <path d="M117 102v91" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <circle cx="242" cy="78" r="22" fill="#fff0e5" />
      <path d="M234 78h16m-8-8v16" stroke="#b84d1e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="115" r="8" fill="#e8f1ff" />
      <path d="M63 55h13m-6-6v12" stroke="#3974d8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function ARExperience() {
  const { profile } = usePerformanceProfile()
  const containerRef = useRef(null)
  const experienceRef = useRef(null)
  const requestRef = useRef(null)
  const modeRef = useRef(null)
  const [mode, setMode] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(1)

  const disposeExperience = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    experienceRef.current?.dispose()
    experienceRef.current = null
  }, [])

  const stopExperience = useCallback((nextStatus = 'idle') => {
    disposeExperience()
    modeRef.current = null
    setMode(null)
    setReady(false)
    setStatus(nextStatus)
    setError('')
  }, [disposeExperience])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && modeRef.current) stopExperience('paused')
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      disposeExperience()
    }
  }, [disposeExperience, stopExperience])

  async function startExperience(nextMode) {
    disposeExperience()
    const controller = new AbortController()
    requestRef.current = controller
    modeRef.current = nextMode
    setMode(nextMode)
    setReady(false)
    setScale(1)
    setError('')
    setStatus('loading')

    const reportFailure = (failure) => {
      if (controller.signal.aborted) return
      stopExperience('error')
      setError(failure?.message || 'No pudimos iniciar la experiencia. Puedes volver a intentarlo o explorar sin cámara.')
    }

    try {
      if (nextMode === 'ar' && !window.isSecureContext) {
        throw new Error('La cámara necesita una conexión segura. Abre esta página mediante HTTPS, o usa la vista sin cámara.')
      }
      const { createLabExperience } = await import('./labARRuntime.js')
      if (controller.signal.aborted) return
      const experience = await createLabExperience({
        container: containerRef.current,
        mode: nextMode,
        reduced: profile === 'reduced',
        signal: controller.signal,
        onStatus: (nextStatus) => {
          if (!controller.signal.aborted) setStatus(nextStatus)
        },
        onError: reportFailure,
      })
      if (controller.signal.aborted) {
        experience.dispose()
        return
      }
      experienceRef.current = experience
      setReady(true)
      if (nextMode === 'preview') setStatus('found')
    } catch (failure) {
      reportFailure(failure)
    }
  }

  const loading = status === 'loading'
  const showIllustration = !mode || loading
  const statusText = status === 'loading'
    ? 'Preparando tu experiencia…'
    : status === 'error'
      ? 'No se pudo iniciar'
      : status === 'paused'
      ? 'Experiencia pausada'
      : mode === 'preview'
        ? 'Vista 3D sin cámara'
        : status === 'found'
          ? 'Tarjeta detectada'
          : status === 'lost'
            ? 'Vuelve a encuadrar la tarjeta'
            : status === 'searching'
              ? 'Buscando el marcador Hiro'
              : 'Listo para explorar'

  return (
    <main className="ar-demo-page">
      <header className="ar-demo-header">
        <Link to="/modulo/1" className="ar-demo-back"><span aria-hidden="true">←</span> Laboratorio</Link>
        <span className="ar-demo-header-label">LabVirtual <span aria-hidden="true">/</span> Realidad aumentada</span>
        <Link to="/ar/tarjeta" className="ar-demo-card-link">Obtener tarjeta <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="ar-demo-content">
        <div className="ar-demo-heading">
          <span className="ar-demo-eyebrow"><span aria-hidden="true">✦</span> DEMO · APRENDE EN TU ESPACIO</span>
          <h1>El laboratorio llega a <span>tu mesa.</span></h1>
          <p>Apunta a la tarjeta y descubre un instrumento sobre ella. Acércate, cambia su tamaño y observa sus detalles.</p>
        </div>

        <div className="ar-demo-layout">
          <section className="ar-demo-viewer" aria-label="Explorador del instrumento">
            <div className={`ar-demo-stage ${mode === 'ar' ? 'ar-demo-stage-camera' : ''}`}>
              <div ref={containerRef} className="ar-demo-runtime" role="img" aria-label={mode === 'ar' ? 'Modelo 3D sobre la imagen de tu cámara' : 'Modelo tridimensional del vaso de precipitados'} />
              {showIllustration && <div className="ar-demo-stage-intro"><BeakerIllustration /><span>Una tarjeta. Un nuevo descubrimiento.</span></div>}
              <div className={`ar-demo-status ${status === 'found' ? 'ar-demo-status-found' : ''}`} role="status" aria-live="polite">
                <span className="ar-demo-status-dot" aria-hidden="true" />{statusText}
              </div>
              {mode === 'ar' && !loading && status !== 'found' && (
                <div className="ar-demo-tracking-hint">
                  <span className="ar-demo-target" aria-hidden="true" />
                  <p>Mantén todo el cuadro negro dentro de la cámara, con buena luz y sin reflejos.</p>
                </div>
              )}
              {mode && <button type="button" className="ar-demo-stop" onClick={() => stopExperience()} aria-label={mode === 'ar' ? 'Cerrar experiencia y apagar cámara' : 'Cerrar vista 3D'}>✕ <span>Cerrar</span></button>}
              <span className="ar-demo-stage-caption">{AR_DEMO.title}</span>
            </div>

            {ready && (
              <div className="ar-demo-controls" aria-label="Controles del modelo">
                <div className="ar-demo-rotate">
                  <button type="button" onClick={() => experienceRef.current?.rotate(-1)} aria-label="Girar modelo a la izquierda">↶</button>
                  <span>Girar</span>
                  <button type="button" onClick={() => experienceRef.current?.rotate(1)} aria-label="Girar modelo a la derecha">↷</button>
                </div>
                <label className="ar-demo-scale">
                  <span>Tamaño <output>{Math.round(scale * 100)} %</output></span>
                  <input type="range" min="0.6" max="1.6" step="0.1" value={scale} onChange={(event) => {
                    const nextScale = Number(event.target.value)
                    setScale(nextScale)
                    experienceRef.current?.setScale(nextScale)
                  }} />
                </label>
                <button type="button" className="ar-demo-reset" onClick={() => { experienceRef.current?.reset(); setScale(1) }}>Restablecer</button>
              </div>
            )}

            <div className="ar-demo-actions">
              <button type="button" className="ar-demo-button ar-demo-button-primary" disabled={loading || (ready && mode === 'ar')} onClick={() => startExperience('ar')}><CameraIcon />Activar cámara</button>
              <button type="button" className="ar-demo-button ar-demo-button-secondary" disabled={loading || (ready && mode === 'preview')} onClick={() => startExperience('preview')}>Explorar sin cámara</button>
            </div>
            {error && <p className="ar-demo-message ar-demo-message-error" role="alert">{error}</p>}
            {status === 'paused' && <p className="ar-demo-message">Pausamos la experiencia al salir de esta pestaña. Usa los botones para volver a iniciarla.</p>}
            <p className="ar-demo-privacy">La cámara se activa solo cuando tú lo decides. Este demo no graba ni envía imágenes de tu cámara.</p>
          </section>

          <aside className="ar-demo-guide" aria-label="Guía de la experiencia">
            <div className="ar-demo-guide-card">
              <span className="ar-demo-guide-kicker">DE LA TARJETA A TU MESA</span>
              <h2>Prueba la magia de la ciencia</h2>
              <ol className="ar-demo-steps">
                <li><span className="ar-demo-step-number">01</span><div><h3>Prepara la tarjeta</h3><p>Usa la impresión con el marcador Hiro. El QR abre esta página; el cuadro negro coloca el modelo.</p></div></li>
                <li><span className="ar-demo-step-number">02</span><div><h3>Apunta con tu cámara</h3><p>Actívala, acepta el permiso y encuadra el marcador completo sobre una superficie plana.</p></div></li>
                <li><span className="ar-demo-step-number">03</span><div><h3>Observa y explora</h3><p>Mueve el teléfono alrededor de la tarjeta. Usa los controles para girar y cambiar el tamaño del instrumento.</p></div></li>
              </ol>
              <Link to="/ar/tarjeta" className="ar-demo-print-link">Ver tarjeta para imprimir <span aria-hidden="true">→</span></Link>
            </div>

            <details className="ar-demo-info" open>
              <summary><span><span className="ar-demo-info-icon" aria-hidden="true">i</span>Conoce el instrumento</span><span className="ar-demo-info-chevron" aria-hidden="true">⌄</span></summary>
              <div className="ar-demo-info-body"><h2>{AR_DEMO.title}</h2><p>{AR_DEMO.description}</p><p><strong>En el laboratorio:</strong> {AR_DEMO.use}</p><p className="ar-demo-think">Observa sus marcas: ¿servirá para medir un volumen con mucha precisión?</p><p className="ar-demo-disclaimer">Representación simplificada para este demo. Su tamaño en pantalla no es una referencia de medida real.</p></div>
            </details>
            <p className="ar-demo-tip">Si tu tarjeta está enmicada, inclínala un poco para evitar el brillo. También puedes probar la vista 3D sin cámara.</p>
          </aside>
        </div>
        <footer className="ar-demo-footer">Explora a tu ritmo <span aria-hidden="true">·</span> Sin instalar una app</footer>
      </div>
    </main>
  )
}
