import React, { Suspense, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
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
  { id: 'parrilla', label: 'Parrilla Eléctrica',   emoji: '🔥', url: '/models/termoLab5M.glb',        scale: 0.3,  position: [0,-1,0], info: { descripcion: 'Plataforma calefactora para calentar recipientes de laboratorio.',                                       uso: 'Se utiliza para calentar mezclas a temperaturas controladas.' } },
  { id: 'molde',    label: 'Molde para Jabones',   emoji: '🟫', url: '/models/mintOrganizer5M.glb',   scale: 0.07, position: [0,-1,0], info: { descripcion: 'Recipientes para dar forma a los jabones durante la solidificación.',                                    uso: 'Permiten crear jabones con formas específicas y facilitar su extracción.' } },
  { id: 'gafas',    label: 'Lentes de Cristal de Protección',   emoji: '🟫', url: '/models/crystal_Safety_Google5M.glb',   scale: 0.2, position: [0,-1,0], info: { descripcion: 'Este equipamiento recibe el nombre de gafas de seguridad o gafas de protección.',                                    uso: 'Proteger los ojos del trabajador de forma efectiva, garantizando su seguridad.' } },
]

function Loader() {
  return (
    <Html center>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'#00e5c3', fontFamily:'DM Sans,sans-serif', fontSize:'0.82rem' }}>
        <div style={{ width:32, height:32, border:'3px solid rgba(0,229,195,0.2)', borderTop:'3px solid #00e5c3', borderRadius:'50%', animation:'m1spin 0.9s linear infinite' }} />
        Cargando...
      </div>
    </Html>
  )
}

function GLTFModel({ url, scale, position }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (!scene) return
    try {
      scene.traverse((child) => {
        if (!child.isMesh || !child.material) return
        const mat = child.material
        const mapKeys = ['map','aoMap','emissiveMap','specularMap','metalnessMap','roughnessMap','alphaMap','lightMap']
        mapKeys.forEach(k => {
          const tx = mat[k]
          if (tx && tx.isTexture) {
            try { tx.flipY = false } catch (e) {}
            try { tx.premultiplyAlpha = false } catch (e) {}
            try { tx.needsUpdate = true } catch (e) {}
          }
        })
      })
    } catch (e) { /* ignore traversal errors */ }
  }, [scene])

  return <primitive object={scene} scale={scale} position={position} />
}

function DetailModal({ model, onClose, mainCanvasRef, setGlLost }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'1.6rem' }}>{model.emoji}</span>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'0.67rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#00e5c3', marginBottom:2 }}>Material de laboratorio</div>
              <h2 style={{ margin:0, fontFamily:'Syne,sans-serif', fontSize:'1.15rem', fontWeight:700, color:'#e8eaf0' }}>{model.label}</h2>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-model-view">
              <Canvas
                camera={{ position:[0,2,6], fov:45 }}
                gl={{ antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false }}
                onCreated={(state) => {
                  // conservative pixel ratio to save VRAM on low-end devices
                  try { state.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)) } catch (e) {}
                  const canvas = state.gl && state.gl.domElement
                  if (!canvas) return
                  if (mainCanvasRef && mainCanvasRef.current !== undefined) mainCanvasRef.current = canvas

                  const onLost = (ev) => { ev.preventDefault(); console.warn('WebGL context lost'); if (typeof setGlLost === 'function') setGlLost(true) }
                  const onRestored = () => { console.info('WebGL context restored'); if (typeof setGlLost === 'function') setGlLost(false) }

                  canvas.addEventListener('webglcontextlost', onLost, false)
                  canvas.addEventListener('webglcontextrestored', onRestored, false)

                  // store handlers so we can remove later
                  canvas._onWebglContextLost = onLost
                  canvas._onWebglContextRestored = onRestored
                }}
              >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5,5,5]} intensity={1.2} />
              <pointLight position={[-5,3,-5]} intensity={0.4} color="#4f8eff" />
              <Suspense fallback={<Loader />}>
                <GLTFModel url={model.url} scale={model.scale * 1.5} position={model.position} />
                <Environment preset="studio" />
                <ContactShadows position={[0,-1.5,0]} opacity={0.5} scale={6} blur={2.5} />
              </Suspense>
              <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.8} />
            </Canvas>
          </div>
          <div className="modal-info">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'0.67rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#00e5c3' }}>Descripción</div>
              <p style={{ margin:0, fontSize:'0.86rem', color:'#7b8399', lineHeight:1.75 }}>{model.info.descripcion}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:'0.67rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4f8eff' }}>Uso en laboratorio</div>
              <p style={{ margin:0, fontSize:'0.86rem', color:'#7b8399', lineHeight:1.75 }}>{model.info.uso}</p>
            </div>
            <div style={{ background:'rgba(0,229,195,0.05)', border:'1px solid rgba(0,229,195,0.16)', borderRadius:10, padding:12, fontSize:'0.76rem', color:'#7b8399', lineHeight:1.7, marginTop:'auto' }}>
              💡 Arrastra para rotar · 🖱️ Rueda para zoom
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Modulo1() {
  const [idx, setIdx]     = useState(0)
  const [modal, setModal] = useState(false)
  const [glLost, setGlLost] = useState(false)
  const model             = modelOptions[idx]
  const prev = () => setIdx(i => (i - 1 + modelOptions.length) % modelOptions.length)
  const next = () => setIdx(i => (i + 1) % modelOptions.length)

  const animeRef = useRef(null)
  const mainCanvasRef = useRef(null)
  const modalCanvasRef = useRef(null)

  // Preload only current and adjacent models to avoid loading all models into GPU memory
  useEffect(() => {
    try {
      useGLTF.preload(model.url)
      const next = modelOptions[(idx + 1) % modelOptions.length]
      const prev = modelOptions[(idx - 1 + modelOptions.length) % modelOptions.length]
      if (next) useGLTF.preload(next.url)
      if (prev) useGLTF.preload(prev.url)
    } catch (e) { /* ignore preload issues */ }
  }, [idx, model.url])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let mounted = true
    // add class so CSS hides header only when JS will animate it
    try { document.documentElement.classList.add('js-animate') } catch (e) {}
    import('animejs').then(mod => {
      // Normalize different export shapes: module, default, { anime }, etc.
      let a = mod
      try {
        if (mod && mod.default) a = mod.default
        if (a && typeof a === 'object' && typeof a.anime === 'function') a = a.anime
      } catch (e) { /* ignore */ }

      if (!mounted || typeof a !== 'function') {
        try { document.documentElement.classList.remove('js-animate') } catch (e) {}
        return
      }

      animeRef.current = a
      const run = animeRef.current
      const headerTargets = ['.m1-header-badge', '.m1-title', '.m1-subtitle']

      // header animation: use timeline when available, otherwise stagger via delay callback
      try {
        if (typeof run.timeline === 'function') {
          const stagger = (typeof run.stagger === 'function') ? run.stagger(110) : 110
          run.timeline({}).add({
            targets: headerTargets,
            translateY: [18, 0],
            opacity: [0, 1],
            delay: stagger,
            easing: 'easeOutCubic',
            duration: 520,
          })
        } else {
          run({
            targets: headerTargets,
            translateY: [18, 0],
            opacity: [0, 1],
            delay: function(el, i) { return i * 110 },
            easing: 'easeOutCubic',
            duration: 520,
          })
        }
      } catch (err) {
        console.warn('animejs header animation failed', err)
      }

      // badge pulse
      try {
        run({
          targets: '.m1-dot-badge',
          scale: [1, 1.08],
          direction: 'alternate',
          duration: 1500,
          easing: 'easeInOutSine',
          loop: true,
        })
      } catch (err) {
        console.warn('animejs pulse failed', err)
      }
    }).catch(err => {
      console.warn('animejs import failed', err)
      try { document.documentElement.classList.remove('js-animate') } catch (e) {}
    })

    return () => { mounted = false; try { document.documentElement.classList.remove('js-animate') } catch (e) {} }
  }, [])

  // Remove any canvas event listeners on unmount to avoid leaking contexts
  useEffect(() => {
    return () => {
      try {
        ;[mainCanvasRef.current, modalCanvasRef.current].forEach(canvas => {
          if (!canvas) return
          if (canvas._onWebglContextLost) canvas.removeEventListener('webglcontextlost', canvas._onWebglContextLost)
          if (canvas._onWebglContextRestored) canvas.removeEventListener('webglcontextrestored', canvas._onWebglContextRestored)
          try { delete canvas._onWebglContextLost } catch (e) {}
          try { delete canvas._onWebglContextRestored } catch (e) {}
        })
      } catch (e) { /* ignore */ }
    }
  }, [])

  const handlePointerDown = (e) => {
    const el = e.currentTarget
    const a = animeRef.current
    if (!a) return
    a.remove(el)
    a({ targets: el, scale: 0.96, duration: 120, easing: 'easeOutQuad' })
  }

  const handlePointerUp = (e) => {
    const el = e.currentTarget
    const a = animeRef.current
    if (!a) return
    a.remove(el)
    a({ targets: el, scale: 1, duration: 280, elasticity: 600, easing: 'easeOutElastic' })
  }

  return (
    <>
      {glLost && (
        <div style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', color:'#fff', padding:20 }}>
          <div style={{ maxWidth:540, textAlign:'center', background:'rgba(0,0,0,0.6)', padding:20, borderRadius:12 }}>
            <h3 style={{ marginTop:0 }}>Se perdió el contexto WebGL</h3>
            <p>La escena 3D tuvo un problema con el contexto gráfico. Puedes recargar la página para intentar restaurarlo.</p>
            <button style={{ marginTop:12, padding:'8px 14px', borderRadius:8, border:'none', background:'#00e5c3', color:'#062023' }} onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </div>
      )}
      <div className="m1-page" style={{
        '--mod-page-bg': '#f3f4f6',
        '--mod-page-text': '#0f172a',
      }}>

        <header className="m1-header">
          <div className="m1-header-badge">
            <span className="m1-dot-badge" />
            Módulo 01
          </div>
          <h1 className="m1-title">Reconocimiento de material de laboratorio</h1>
          <p className="m1-subtitle">Identifica los instrumentos necesarios para la reacción de saponificación.</p>
        </header>

        <div className="m1-layout">
          <aside className="m1-sidebar">
            <div className="m1-sidebar-block">
              <div className="m1-sidebar-lbl" style={{ color: '#4f8eff' }}>Objetivo</div>
              <p className="m1-sidebar-p">Identificar el material de laboratorio necesario para la elaboración de jabones ecológicos mediante saponificación.</p>
            </div>

            <div className="m1-sidebar-block">
              <div className="m1-sidebar-lbl" style={{ color: '#00e5c3' }}>Instrumentos</div>
              <ul className="m1-list">
                {modelOptions.map((m, i) => (
                  <li
                    key={m.id + '-' + i}
                    className={`m1-list-item ${i === idx ? 'active' : ''}`}
                    onClick={() => setIdx(i)}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    <span>{m.emoji}</span><span>{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="m1-instruccion-box">
              <div className="m1-sidebar-lbl" style={{ color: '#ff6b35' }}>⚡ Instrucción</div>
              <p className="m1-sidebar-p">Selecciona un instrumento de la lista o usa las flechas ‹ ›. Haz clic en <strong style={{ color:'#e8eaf0' }}>'Ver detalles'</strong> para explorarlo en pantalla completa.</p>
            </div>
          </aside>

          <div className="m1-viewer">
            <div className="m1-tabs">
              {modelOptions.map((m, i) => (
                <button
                  key={m.id + '-' + i}
                  className={`m1-tab ${i === idx ? 'active' : ''}`}
                  onClick={() => setIdx(i)}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <span>{m.emoji}</span><span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="m1-canvas-box">
              <Canvas camera={{ position:[0,2,6], fov:45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5,5,5]} intensity={1} />
                <pointLight position={[-4,2,-4]} intensity={0.3} color="#4f8eff" />
                <Suspense fallback={<Loader />}>
                  <GLTFModel url={model.url} scale={model.scale} position={model.position} />
                  <Environment preset="studio" />
                  <ContactShadows position={[0,-1.5,0]} opacity={0.4} scale={6} blur={2} />
                </Suspense>
                <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={1.5} />
              </Canvas>

              <button className="m1-arrow m1-arrow-l" onClick={prev} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>‹</button>
              <button className="m1-arrow m1-arrow-r" onClick={next} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>›</button>

              <div className="m1-label-float">{model.emoji} {model.label}</div>
            </div>

            <div className="m1-viewer-footer">
              <span className="m1-counter">{idx + 1} / {modelOptions.length}</span>
              <button className="m1-detail-btn" onClick={() => setModal(true)} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>Ver detalles →</button>
            </div>
          </div>
        </div>

        <div className="m1-nav">
          <a href="/" className="m1-nav-btn-link secondary">← Inicio</a>
          <div className="m1-nav-dots">
            <span className="m1-nav-dot on" />
            <span className="m1-nav-dot" />
            <span className="m1-nav-dot" />
          </div>
          <a href="/modulo/2" className="m1-nav-btn-link primary">Siguiente módulo →</a>
        </div>
      </div>

      {modal && createPortal(
        <DetailModal model={model} onClose={() => setModal(false)} mainCanvasRef={mainCanvasRef} setGlLost={setGlLost} />,
        document.body
      )}
    </>
  )
}

// Preloading is handled dynamically in the component to avoid GPU pressure
// EOF
