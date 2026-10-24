import React from 'react'
import { Link } from 'react-router-dom'
import { AR_INSTRUMENTS, cardPath, instrumentPath } from '../../data/instruments'
import './ARExperience.css'

export function UnknownInstrument() {
  return <section className="ar-demo-content">
    <h1>Instrumento no encontrado</h1>
    <p>Este enlace no corresponde a un instrumento del catálogo.</p>
    <Link className="ar-demo-card-link" to="/ar">Elegir un instrumento</Link>
  </section>
}

export default function ARCatalog() {
  return <div className="ar-demo-page">
    <header className="ar-demo-header">
      <Link className="ar-demo-back" to="/modulo/1">← Laboratorio</Link>
      <Link className="ar-demo-card-link" to="/ar/tarjeta">Preparar tarjetas</Link>
    </header>
    <div className="ar-demo-content">
      <div className="ar-demo-heading">
        <span className="ar-demo-eyebrow">CIENCIA EN TU ESPACIO</span>
        <h1>Tu catálogo de <span>realidad aumentada.</span></h1>
        <p>Elige uno de los {AR_INSTRUMENTS.length} instrumentos. Abre su visor o prepara una tarjeta con su QR y marcador exclusivo. Los modelos se cargan solo al iniciar la experiencia.</p>
      </div>
      <div className="ar-catalog-grid">
        {AR_INSTRUMENTS.map(item => <article className="ar-catalog-item" key={item.id}>
          <div className="ar-catalog-top"><span aria-hidden="true">{item.emoji}</span><small>{item.markerCode}</small></div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <div className="ar-catalog-actions">
            <Link className="ar-demo-button ar-demo-button-primary" to={instrumentPath(item.id)}>Explorar instrumento</Link>
            <Link className="ar-demo-button ar-demo-button-secondary" to={cardPath(item.id)}>Generar tarjeta y QR</Link>
          </div>
        </article>)}
      </div>
    </div>
  </div>
}
