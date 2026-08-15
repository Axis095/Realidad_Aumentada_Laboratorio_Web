import React, { Suspense, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html, Clone } from '@react-three/drei'
import { animate, stagger } from 'animejs'
import useLabStore from '../../store/Uselabstore'
import './ModuloBase.css'
import './Modulo1.css'

const modelOptions = [
  { id: 'beaker',   label: 'Vaso de precipitados', emoji: '🧪', url: '/models/beaker5M.glb',          scale: 0.55, position: [0,-1,0], info: { descripcion: 'Recipiente cilíndrico de vidrio utilizado para contener líquidos y realizar reacciones químicas.',      uso: 'Se utiliza para mezclar sustancias, calentar soluciones y observar reacciones en el laboratorio.' } },
  { id: 'probeta',  label: 'Probeta graduada',      emoji: '⚗️', url: '/models/probeta10M.glb',        scale: 0.45, position: [0,-1,0], info: { descripcion: 'Tubo cilíndrico graduado para medir volúmenes de líquidos con precisión.',                           uso: 'Ideal para medir volúmenes exactos en experimentos químicos.' } },
  { id: 'balanza',  label: 'Balanza Digital',       emoji: '⚖️', url: '/models/digital_kitchen5M.glb', scale: 0.2,  position: [0,-1,0], info: { descripcion: 'Instrumento electrónico para medir la masa de sustancias con alta precisión.',                        uso: 'Esencial para pesar reactivos y productos en reacciones químicas.' } },
  { id: 'termo',    label: 'Termómetro',            emoji: '🌡️', url: '/models/termometro5M.glb',      scale: 0.5,  position: [0,-1,0], info: { descripcion: 'Dispositivo para medir la temperatura de sustancias.',                                                uso: 'Se utiliza para controlar temperaturas en reacciones exotérmicas o endotérmicas.' } },
  { id: 'agitador', label: 'Agitador de Vidrio',   emoji: '🔬', url: '/models/agitador_vidrio5M.glb', scale: 0.05, position: [0,-1,0], info: { descripcion: 'Varilla de vidrio para mezclar soluciones manualmente.',                                               uso: 'Ayuda a disolver sólidos en líquidos y homogenizar mezclas.' } },
  { id: 'espatula', label: 'Espátula',              emoji: '🔧', url: '/models/blade5M.glb',           scale: 0.1,  position: [0,-1,0], info: { descripcion: 'Herramienta metálica para transferir sólidos en pequeñas cantidades.',                                  uso: 'Útil para medir y transferir polvos o cristales sin derramar.' } },
  { id: 'guantes',  label: 'Guantes',               emoji: '🧤', url: '/models/blue_nitrile5M.glb',    scale: 0.5,  position: [0,-1,0], info: { descripcion: 'Guantes resistentes a químicos para proteger las manos.',                                               uso: 'Protegen contra sustancias corrosivas y mantienen la higiene en el laboratorio.' } },
  { id: 'parrilla', label: 'Parrilla Eléctrica',   emoji: '🔥', url: '/models/PARRILLA ELECTRICA LOW POLY.glb', scale: 0.3, position: [0,-1,0], info: { descripcion: 'Plataforma calefactora para calentar recipientes de laboratorio.', uso: 'Se utiliza para calentar mezclas a temperaturas controladas.' } },
  { id: 'molde',    label: 'Molde para Jabones',   emoji: '🧼', url: '/models/mintOrganizer5M.glb',   scale: 0.07, position: [0,-1,0], info: { descripcion: 'Recipientes para dar forma a los jabones durante la solidificación.',                                    uso: 'Permiten crear jabones con formas específicas y facilitar su extracción.' } },
  { id: 'gafas',    label: 'Lentes de Cristal de Protección',   emoji: '🕶️', url: '/models/crystal_Safety_Google5M.glb',   scale: 0.2, position: [0,-1,0], info: { descripcion: 'Este equipamiento recibe el nombre de gafas de seguridad o gafas de protección.',                                    uso: 'Proteger los ojos del trabajador de forma efectiva, garantizando su seguridad.' } },
]

function Loader() {
  return (
    <Html center>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'var(--clr-blue)', fontFamily:'var(--font-body)', fontSize:'0.82rem' }}>
        <div style={{ width:32, height:32, border:'3px solid rgba(57,116,216,.18)', borderTop:'3px solid var(--clr-blue)', borderRadius:'50%', animation:'m1spin 0.9s linear infinite' }} />
        Cargando...
      </div>
    </Html>
  )
}

function GLTFModel({ url, scale, position }) {
  const { scene } = useGLTF(url)
  // Keep useGLTF's cached scene as an immutable template. A deep clone gives
  // every mount its own geometries and materials, which R3F can safely dispose.
  return <Clone object={scene} deep scale={scale} position={position} />
}

export default function Modulo1() {
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
    if (instrumentosExplorados.length >= modelOptions.length) completarModulo(1)
  }, [instrumentosExplorados.length, completarModulo])

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
          <p className="m1-subtitle">Identifica los instrumentos necesarios para la reacción de saponificación.</p>
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
            <div className="m1-progress-card" aria-label={`${instrumentosExplorados.length} de ${modelOptions.length} instrumentos explorados`}>
              <div className="m1-progress-copy">
                <strong>Tu exploración</strong>
                <span>{instrumentosExplorados.length}/{modelOptions.length}</span>
              </div>
              <div className="m1-progress-track"><span style={{ width: `${(instrumentosExplorados.length / modelOptions.length) * 100}%` }} /></div>
              <small>{instrumentosExplorados.length === modelOptions.length ? '¡Módulo completado!' : 'Selecciona cada instrumento para completar el módulo.'}</small>
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
              <Canvas
                camera={{ position:[0,2,6], fov:45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, powerPreference: 'low-power' }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5,5,5]} intensity={1} />
                <pointLight position={[-4,2,-4]} intensity={0.3} color="#3974d8" />
                <Suspense fallback={<Loader />}>
                  <GLTFModel url={model.url} scale={model.scale} position={model.position} />
                  <Environment preset="studio" />
                  <ContactShadows position={[0,-1.5,0]} opacity={0.4} scale={6} blur={2} />
                </Suspense>
                <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={1.5} />
              </Canvas>

              <button className="m1-arrow m1-arrow-l" aria-label="Instrumento anterior" onClick={prev} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>‹</button>
              <button className="m1-arrow m1-arrow-r" aria-label="Instrumento siguiente" onClick={next} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>›</button>

              <div ref={labelRef} className="m1-label-float">{model.emoji} {model.label}</div>
            </div>

            <div className="m1-viewer-footer">
              <span ref={counterRef} className="m1-counter">{idx + 1} / {modelOptions.length}</span>
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

// Preloading is handled dynamically in the component to avoid GPU pressure
// EOF
