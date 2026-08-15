import React from 'react'
import { Link } from 'react-router-dom'
import useLabStore from '../../store/Uselabstore'
import './Bienvenida.css'
 
export default function Bienvenida() {
  const ultimaRuta = useLabStore((state) => state.ultimaRuta)
  const modulosCompletados = useLabStore((state) => state.modulosCompletados)
  const instrumentosExplorados = useLabStore((state) => state.instrumentosExplorados)
  const pasosExplorados = useLabStore((state) => state.pasosModulo2Explorados)
  const moleculasExploradas = useLabStore((state) => state.moleculasExploradas)
  const progresoModulo1 = modulosCompletados.includes(1)
    ? 1
    : Math.min(instrumentosExplorados.length / 10, 1)
  const progresoModulo2 = modulosCompletados.includes(2) ? 1 : Math.min(pasosExplorados.length / 5, 1)
  const progresoModulo3 = modulosCompletados.includes(3) ? 1 : Math.min(moleculasExploradas.length / 4, 1)
  const progresoGeneral = Math.round(((progresoModulo1 + progresoModulo2 + progresoModulo3) / 3) * 100)
  const haComenzado = progresoGeneral > 0

  return (
    <div className="bienvenida-page">
      {/* Partículas decorativas */}
      <div className="particles" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>
 
      {/* Hero */}
      <section className="hero fade-up">
        <div className="hero-tag fade-up">
          <span className="tag-dot" />
          Proyecto de Quimica, elaboración de Jabónes
        </div>
 
        <h1 className="hero-title fade-up-delay-1">
          Laboratorio Virtual de<br />
          <span className="hero-highlight">Saponificación</span>
        </h1>
 
        <p className="hero-desc fade-up-delay-2">
          Explora el proceso de elaboración de jabones ecológicos a través de
          visualizaciones 3D interactivas y realidad aumentada. Aprende desde
          el material de laboratorio hasta la reacción molecular.
        </p>
 
        <div className="hero-cta fade-up-delay-3">
          <Link to={haComenzado ? ultimaRuta : '/modulo/1'} className="btn-primary">
            {haComenzado ? 'Continuar aprendizaje →' : 'Comenzar experiencia →'}
          </Link>
          <Link to="/modulo/2" className="btn-secondary">
            Ver reacción química
          </Link>
        </div>
      </section>

      {haComenzado && (
        <section className="home-progress fade-up-delay-3" aria-label={`Progreso general ${progresoGeneral}%`}>
          <div className="home-progress-heading">
            <div><span>Tu recorrido</span><strong>Sigue aprendiendo a tu ritmo</strong></div>
            <b>{progresoGeneral}%</b>
          </div>
          <div className="home-progress-track"><span style={{ width: `${progresoGeneral}%` }} /></div>
          <small>{modulosCompletados.length} de 3 módulos completados · {instrumentosExplorados.length} instrumentos explorados</small>
        </section>
      )}
 
      {/* Tarjetas de módulos */}
      <section className="modules-grid fade-up-delay-4">
        <ModuleCard
          num="01"
          color="#3974d8"
          icon="🧪"
          title="Material de Laboratorio"
          desc="Identifica y manipula los instrumentos necesarios para la reacción de saponificación en 3D interactivo."
          path="/modulo/1"
          tags={['Vaso de precipitados', 'Probeta', 'Balanza']}
          completed={modulosCompletados.includes(1)}
        />
        <ModuleCard
          num="02"
          color="#218c68"
          icon="🔬"
          title="Reacción de Saponificación"
          desc="Observa paso a paso el proceso de saponificación: mezcla de aceite usado y NaOH hasta la formación del jabón."
          path="/modulo/2"
          tags={['Aceite + NaOH', 'Etapas del proceso', 'Animación 3D']}
          completed={modulosCompletados.includes(2)}
        />
        <ModuleCard
          num="03"
          color="#e96f32"
          icon="⚛"
          title="Nivel Molecular"
          desc="Visualiza la reacción a nivel molecular con realidad aumentada. Identifica triglicéridos, glicerol y jabón."
          path="/modulo/3"
          tags={['Triglicéridos', 'Glicerol', 'Realidad Aumentada']}
          completed={modulosCompletados.includes(3)}
        />
      </section>
 
      {/* Info objetivos */}
      <section className="objectives-strip fade-up-delay-4">
        <div className="obj-label">Objetivos de aprendizaje</div>
        <div className="obj-list">
          <div className="obj-item">
            <span className="obj-num">1</span>
            Identificar el material de laboratorio para saponificación
          </div>
          <div className="obj-item">
            <span className="obj-num">2</span>
            Describir las etapas del proceso de elaboración de jabón
          </div>
          <div className="obj-item">
            <span className="obj-num">3</span>
            Explicar la reacción a nivel molecular
          </div>
          <div className="obj-item">
            <span className="obj-num">4</span>
            Interpretar la ecuación química de saponificación
          </div>
        </div>
      </section>
    </div>
  )
}
 
function ModuleCard({ num, color, icon, title, desc, path, tags, completed }) {
  return (
    <Link to={path} className="module-card glass-card" style={{ '--mod-color': color }}>
      <div className="mc-header">
        <span className="mc-num" style={{ color }}>{num}</span>
        <span className="mc-icon">{icon}</span>
      </div>
      <span className={`mc-status ${completed ? 'completed' : ''}`}>{completed ? '✓ Completado' : 'Disponible'}</span>
      <h3 className="mc-title">{title}</h3>
      <p className="mc-desc">{desc}</p>
      <div className="mc-tags">
        {tags.map((t) => (
          <span key={t} className="mc-tag" style={{ '--mod-color': color }}>{t}</span>
        ))}
      </div>
      <div className="mc-arrow" style={{ color }}>{completed ? 'Repasar →' : 'Entrar →'}</div>
    </Link>
  )
}
