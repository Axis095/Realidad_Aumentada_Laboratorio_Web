import React, { Suspense, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import './ModuloBase.css'

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
  { id: 'molde',    label: 'Lentes de Cristal de Protección',   emoji: '🟫', url: '/models/crystal_Safety_Google5M.glb',   scale: 0.2, position: [0,-1,0], info: { descripcion: 'Este equipamiento recibe el nombre de gafas de seguridad o gafas de protección.',                                    uso: 'Proteger los ojos del trabajador de forma efectiva, garantizando su seguridad.' } },
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
  return <primitive object={scene} scale={scale} position={position} />
}

function DetailModal({ model, onClose }) {
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
            <Canvas camera={{ position:[0,2,6], fov:45 }}>
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
  const model             = modelOptions[idx]
  const prev = () => setIdx(i => (i - 1 + modelOptions.length) % modelOptions.length)
  const next = () => setIdx(i => (i + 1) % modelOptions.length)

  return (
    <>
      <div className="modulo-page" style={{
          '--mod-page-bg': '#f3f4f6',
          '--mod-page-text': '#0f172a',
          '--mod-header-start': 'rgba(148,163,184,0.1)',
          '--mod-info-bg': 'rgba(255,255,255,0.82)',
          '--mod-info-border': 'rgba(148,163,184,0.22)',
          '--mod-btn-text': '#0f172a',
          '--mod-color': '#5b7284',
        }}>

        <header className="modulo-header">
          <div className="modulo-badge">
            <span className="m1-dot-badge" />
            Módulo 01
          </div>
          <h1 className="modulo-title">Reconocimiento de material de laboratorio</h1>
          <p className="modulo-subtitle">Identifica los instrumentos necesarios para la reacción de saponificación.</p>
        </header>

        {/* ── Layout principal ── */}
        <div className="modulo-layout">

          {/* Sidebar */}
          <aside className="modulo-info">
            <div className="info-section">
              <div className="info-tag" style={{ color:'#4f8eff' }}>Objetivo</div>
              <p className="info-text">Identificar el material de laboratorio necesario para la elaboración de jabones ecológicos mediante saponificación.</p>
            </div>
            <div className="info-section">
              <div className="info-tag" style={{ color:'#00e5c3' }}>Instrumentos</div>
              <ul className="m1-list">
                {modelOptions.map((m, i) => (
                  <li key={m.id} className={`m1-list-item ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}>
                    <span>{m.emoji}</span><span>{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="instruccion-box">
              <div className="info-tag" style={{ color:'#ff6b35' }}>⚡ Instrucción</div>
              <p className="info-text">Selecciona un instrumento de la lista o usa las flechas ‹ ›. Haz clic en <strong style={{ color:'#e8eaf0' }}>"Ver detalles"</strong> para explorarlo en pantalla completa.</p>
            </div>
          </aside>

          {/* Visor */}
          <div className="m1-viewer">
            {/* Tabs */}
            <div className="m1-tabs">
              {modelOptions.map((m, i) => (
                <button key={m.id} className={`m1-tab ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}>
                  <span>{m.emoji}</span><span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Canvas principal */}
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

              <button className="m1-arrow m1-arrow-l" onClick={prev}>‹</button>
              <button className="m1-arrow m1-arrow-r" onClick={next}>›</button>

              <div className="m1-label-float">{model.emoji} {model.label}</div>
            </div>

            {/* Footer */}
            <div className="m1-viewer-footer">
              <span className="m1-counter">{idx + 1} / {modelOptions.length}</span>
              <button className="m1-detail-btn" onClick={() => setModal(true)}>Ver detalles →</button>
            </div>
          </div>
        </div>

        {/* Navegación módulos */}
        <nav className="modulo-nav">
          <a href="/" className="m1-nav-btn-link secondary">← Inicio</a>
          <div className="m1-nav-dots">
            {[1,2,3].map(n => <span key={n} className={`m1-nav-dot ${n===1?'on':''}`} />)}
          </div>
          <a href="/modulo/2" className="m1-nav-btn-link primary">Siguiente módulo →</a>
        </nav>
      </div>

      {modal && createPortal(
        <DetailModal model={model} onClose={() => setModal(false)} />,
        document.body
      )}
    </>
  )
}

modelOptions.forEach(m => useGLTF.preload(m.url))