import React from 'react'
import { Link } from 'react-router-dom'
import './ModuloBase.css'

export default function ModuloBase({
num,
color,
icon,
titulo,
subtitulo,
objetivo,
contenido,
instruccion,
prevPath,
nextPath,
children,
}) {
return (
    <div className="modulo-page">
      {/* Header del módulo */}
    <header className="modulo-header" style={{ '--mod-color': color }}>
        <div className="modulo-header-inner">
        <div className="modulo-meta">
            <span className="modulo-badge">
            <span className="badge-dot" style={{ background: color }} />
            Módulo {num}
            </span>
            <span className="modulo-icon">{icon}</span>
        </div>
        <h2 className="modulo-titulo fade-up">{titulo}</h2>
        <p className="modulo-subtitulo fade-up-delay-1">{subtitulo}</p>
        </div>
    </header>

      {/* Layout principal */}
    <div className="modulo-layout">
        {/* Panel izquierdo: info */}
        <aside className="modulo-info glass-card fade-up-delay-1">
        <section className="info-section">
            <div className="info-tag" style={{ color }}>Objetivo</div>
            <p className="info-text">{objetivo}</p>
        </section>

        <section className="info-section">
            <div className="info-tag" style={{ color }}>Contenido</div>
            <div className="info-text">{contenido}</div>
        </section>

        {instruccion && (
            <section className="info-section instruccion-box" style={{ borderColor: color + '33' }}>
            <div className="info-tag" style={{ color }}>Instrucción</div>
            <p className="info-text">{instruccion}</p>
            </section>
        )}
        </aside>

        {/* Panel derecho: Canvas 3D */}
        <div className="modulo-canvas-area fade-up-delay-2">
          {children ? children : (
            <div className="canvas-placeholder">
              <span className="icon">🔷</span>
              <span>Aquí irá el visor 3D interactivo</span>
              <small style={{ opacity: 0.5, fontSize: '0.78rem' }}>
                Three.js + @react-three/fiber
              </small>
            </div>
          )}
        </div>
      </div>
 
      {/* Navegación entre módulos */}
      <nav className="modulo-nav">
        {prevPath ? (
          <Link to={prevPath} className="btn-secondary">← Módulo anterior</Link>
        ) : (
          <Link to="/" className="btn-secondary">← Inicio</Link>
        )}
 
        <div className="modulo-progress">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`progress-dot ${Number(num) === n ? 'active' : ''}`}
              style={Number(num) === n ? { background: color } : {}}
            />
          ))}
        </div>
 
        {nextPath ? (
          <Link to={nextPath} className="btn-primary">Siguiente módulo →</Link>
        ) : (
          <span className="btn-primary" style={{ opacity: 0.4, cursor: 'default' }}>
            Fin del laboratorio ✓
          </span>
        )}
      </nav>
    </div>
  )
}