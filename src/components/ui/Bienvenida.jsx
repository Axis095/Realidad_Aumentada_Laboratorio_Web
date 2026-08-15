import React from 'react'
import { Link } from 'react-router-dom'
import './Bienvenida.css'
 
export default function Bienvenida() {
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
          <Link to="/modulo/1" className="btn-primary">
            Comenzar experiencia →
          </Link>
          <Link to="/modulo/2" className="btn-secondary">
            Ver reacción química
          </Link>
        </div>
      </section>
 
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
        />
        <ModuleCard
          num="02"
          color="#218c68"
          icon="🔬"
          title="Reacción de Saponificación"
          desc="Observa paso a paso el proceso de saponificación: mezcla de aceite usado y NaOH hasta la formación del jabón."
          path="/modulo/2"
          tags={['Aceite + NaOH', 'Etapas del proceso', 'Animación 3D']}
        />
        <ModuleCard
          num="03"
          color="#e96f32"
          icon="⚛"
          title="Nivel Molecular"
          desc="Visualiza la reacción a nivel molecular con realidad aumentada. Identifica triglicéridos, glicerol y jabón."
          path="/modulo/3"
          tags={['Triglicéridos', 'Glicerol', 'Realidad Aumentada']}
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
 
function ModuleCard({ num, color, icon, title, desc, path, tags }) {
  return (
    <Link to={path} className="module-card glass-card" style={{ '--mod-color': color }}>
      <div className="mc-header">
        <span className="mc-num" style={{ color }}>{num}</span>
        <span className="mc-icon">{icon}</span>
      </div>
      <h3 className="mc-title">{title}</h3>
      <p className="mc-desc">{desc}</p>
      <div className="mc-tags">
        {tags.map((t) => (
          <span key={t} className="mc-tag" style={{ '--mod-color': color }}>{t}</span>
        ))}
      </div>
      <div className="mc-arrow" style={{ color }}>Entrar →</div>
    </Link>
  )
}
