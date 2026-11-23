import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import InstrumentScene from './InstrumentScene'
import { MODULE1_INSTRUMENTS, getARInstrument, instrumentPath } from '../../data/instruments'
import { animate, stagger } from 'animejs'
import useLabStore from '../../store/Uselabstore'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import './ModuloBase.css'
import './Modulo1.css'

const modelOptions = MODULE1_INSTRUMENTS.map(item => ({
  id: item.id, label: item.title, emoji: item.emoji, url: item.modelUrl,
  info: { descripcion: item.description, uso: item.use },
}))

export default function Modulo1() {
  const { profile } = usePerformanceProfile()
  const reducedPerformance = profile === 'reduced'
  const instrumentoGuardado = useLabStore((state) => state.instrumentoSeleccionado)
  const instrumentosExplorados = useLabStore((state) => state.instrumentosExplorados)
  const setInstrumento = useLabStore((state) => state.setInstrumento)
  const completarModulo = useLabStore((state) => state.completarModulo)
  const setModulo = useLabStore((state) => state.setModulo)
  const [idx, setIdx] = useState(() => {
    const savedIndex = modelOptions.findIndex((item) => item.id === instrumentoGuardado)
    return savedIndex >= 0 ? savedIndex : 0
  })
  const [modal, setModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const model             = modelOptions[idx]
  const exploredCount = modelOptions.filter(item => instrumentosExplorados.includes(item.id)).length
  const prev = () => setIdx(i => (i - 1 + modelOptions.length) % modelOptions.length)
  const next = () => setIdx(i => (i + 1) % modelOptions.length)

  const animationsRef = useRef([])
  const viewerRef = useRef(null)
  const labelRef = useRef(null)
  const counterRef = useRef(null)

  useEffect(() => {
    setModulo(1)
  }, [setModulo])

  useEffect(() => {
    setInstrumento(model.id)
  }, [model.id, setInstrumento])

  useEffect(() => {
    if (exploredCount === modelOptions.length) completarModulo(1)
  }, [exploredCount, completarModulo])

  useEffect(() => {
    const tabs = viewerRef.current?.querySelector('.m1-tabs')
    const active = tabs?.querySelector('.m1-tab.active')
    if (!active || modal) return
    const bounds = tabs.getBoundingClientRect(), item = active.getBoundingClientRect()
    if (item.left < bounds.left) tabs.scrollLeft += item.left - bounds.left - 12
    else if (item.right > bounds.right) tabs.scrollLeft += item.right - bounds.right + 12
  }, [idx, modal])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.classList.add('js-animate')
    animationsRef.current = [
      animate(['.m1-header-badge', '.m1-title', '.m1-subtitle'], {
        translateY: [18, 0],
        opacity: [0, 1],
        delay: stagger(110),
        ease: 'outCubic',
        duration: 520,
      }),
      animate('.m1-dot-badge', {
        scale: [1, 1.08],
        alternate: true,
        duration: 1500,
        ease: 'inOutSine',
        loop: true,
      }),
    ]

    return () => {
      animationsRef.current.forEach(animation => animation.revert())
      animationsRef.current = []
      document.documentElement.classList.remove('js-animate')
    }
  }, [])

  useEffect(() => {
    if (!modal) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setModal(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [modal])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const activeTab = viewerRef.current?.querySelector('.m1-tab.active')
    const targets = [labelRef.current, counterRef.current, activeTab].filter(Boolean)
    animate(targets, {
      opacity: [0.45, 1],
      translateY: [6, 0],
      duration: 360,
      delay: stagger(45),
      ease: 'outCubic',
      composition: 'replace',
    })
  }, [idx])

  useEffect(() => {
    if (!modal || !viewerRef.current) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    animate(viewerRef.current, {
      opacity: [0, 1],
      scale: [0.985, 1],
      duration: 280,
      ease: 'outCubic',
      composition: 'replace',
    })
  }, [modal])

  const handlePointerDown = (e) => {
    const el = e.currentTarget
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    animate(el, { scale: 0.96, duration: 120, ease: 'outQuad', composition: 'replace' })
  }

  const handlePointerUp = (e) => {
    const el = e.currentTarget
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    animate(el, { scale: 1, duration: 280, ease: 'outElastic(1, .6)', composition: 'replace' })
  }

  return (
    <>
      {modal && <div className="m1-detail-backdrop" onClick={() => setModal(false)} />}
      <div className="m1-page" style={{
        '--mod-color': '#3974d8',
        '--mod-page-bg': '#f3f7ff',
        '--mod-page-text': '#183b3a',
        '--mod-info-text': '#526b68',
        '--mod-info-bg': 'rgba(255,255,255,.9)',
        '--mod-info-border': 'rgba(57,116,216,.14)',
        '--mod-surface': '#ffffff',
        '--mod-header-start': 'rgba(57,116,216,.11)',
      }}>

        <header className="m1-header">
          <div className="m1-header-badge">
            <span className="m1-dot-badge" />
            Módulo 1
          </div>
          <h1 className="m1-title">Reconocimiento de material de laboratorio</h1>
          <p className="m1-subtitle">Explora {modelOptions.length} materiales de laboratorio y reconoce su función.</p>
        </header>

        <div className="m1-layout">
          <aside className={`m1-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
            <button
              className="m1-sidebar-toggle"
              type="button"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <span>Guía del módulo</span>
              <span>{sidebarOpen ? '−' : '+'}</span>
            </button>
            <div className="m1-progress-card" aria-label={`${exploredCount} de ${modelOptions.length} instrumentos explorados`}>
              <div className="m1-progress-copy">
                <strong>Tu exploración</strong>
                <span>{exploredCount}/{modelOptions.length}</span>
              </div>
              <div className="m1-progress-track"><span style={{ width: `${(exploredCount / modelOptions.length) * 100}%` }} /></div>
              <small>{exploredCount === modelOptions.length ? '¡Módulo completado!' : 'Selecciona cada instrumento para completar el módulo.'}</small>
            </div>
            <div className="m1-sidebar-block">
              <div className="m1-sidebar-lbl" style={{ color: 'var(--clr-blue)' }}>Objetivo</div>
              <p className="m1-sidebar-p">Identificar el material de laboratorio necesario para la elaboración de jabones ecológicos mediante saponificación.</p>
            </div>

            <div className="m1-sidebar-block">
              <div className="m1-sidebar-lbl" style={{ color: 'var(--clr-green)' }}>Instrumentos</div>
              <ul className="m1-list">
                {modelOptions.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`m1-list-item ${i === idx ? 'active' : ''}`}
                      onClick={() => setIdx(i)}
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      aria-pressed={i === idx}
                    >
                      <span>{m.emoji}</span><span>{m.label}</span>
                      {instrumentosExplorados.includes(m.id) && <span className="m1-seen" aria-label="Explorado">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="m1-instruccion-box">
              <div className="m1-sidebar-lbl" style={{ color: 'var(--clr-orange)' }}>⚡ Instrucción</div>
              <p className="m1-sidebar-p">Selecciona un instrumento de la lista o usa las flechas ‹ ›. Haz clic en <strong>'Ver detalles'</strong> para explorarlo en pantalla completa.</p>
            </div>
          </aside>

          <div ref={viewerRef} className={`m1-viewer ${modal ? 'is-detail-open' : ''}`} role={modal ? 'dialog' : undefined} aria-modal={modal || undefined} aria-label={modal ? `Detalles de ${model.label}` : undefined}>
            {modal && (
              <div className="m1-detail-header">
                <div><small>Material de laboratorio</small><h2>{model.emoji} {model.label}</h2></div>
                <button className="modal-close" onClick={() => setModal(false)} aria-label="Cerrar detalles">✕</button>
              </div>
            )}
            <div className="m1-tabs">
              {modelOptions.map((m, i) => (
                <button
                  key={m.id + '-' + i}
                  className={`m1-tab ${i === idx ? 'active' : ''}`}
                  onClick={() => setIdx(i)}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  aria-pressed={i === idx}
                >
                  <span>{m.emoji}</span><span>{m.label}</span>
                  {instrumentosExplorados.includes(m.id) && <span className="m1-tab-seen" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>

            <div className="m1-canvas-box">
              <InstrumentScene model={model} reducedPerformance={reducedPerformance} />

              <button className="m1-arrow m1-arrow-l" aria-label="Instrumento anterior" onClick={prev} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>‹</button>
              <button className="m1-arrow m1-arrow-r" aria-label="Instrumento siguiente" onClick={next} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>›</button>

              <div ref={labelRef} className="m1-label-float">{model.emoji} {model.label}</div>
            </div>

            <div className="m1-viewer-footer">
              <span ref={counterRef} className="m1-counter">{idx + 1} / {modelOptions.length}</span>
              {getARInstrument(model.id) && <Link className="m1-ar-link" to={instrumentPath(model.id)}>Ver en AR</Link>}
              <button className="m1-detail-btn" onClick={() => setModal(true)} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>Ver detalles →</button>
            </div>
            {modal && (
              <aside className="m1-detail-info">
                <div><strong>Descripción</strong><p>{model.info.descripcion}</p></div>
                <div><strong>Uso en laboratorio</strong><p>{model.info.uso}</p></div>
                <div className="m1-detail-tip">💡 Arrastra para rotar · Usa dos dedos o la rueda para acercar</div>
              </aside>
            )}
          </div>
        </div>

        <div className="m1-nav">
          <Link to="/" className="m1-nav-btn-link secondary">← Inicio</Link>
          <div className="m1-nav-dots">
            <span className="m1-nav-dot on" />
            <span className="m1-nav-dot" />
            <span className="m1-nav-dot" />
          </div>
          <Link to="/modulo/2" className="m1-nav-btn-link primary">Siguiente módulo →</Link>
        </div>
      </div>

    </>
  )
}

// Models load on selection; avoid preloading the entire catalog on mobile.
