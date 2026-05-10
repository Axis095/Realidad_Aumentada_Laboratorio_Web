import React, { useState } from 'react'
import ModuloBase from './ModuloBase'
import QuizModal from './QuizModal'
import './ModuloBase.css'

export default function Modulo3() {
  const [showQuiz, setShowQuiz] = useState(false)

return (
    <>
    <ModuloBase
    num="3"
    color="#fb923c"
    pageStyle={{
      '--mod-page-bg': '#fff7ed',
      '--mod-page-text': '#1e293b',
      '--mod-header-start': 'rgba(251,146,60,0.10)',
      '--mod-info-bg': 'rgba(255,255,255,0.92)',
      '--mod-info-border': 'rgba(251,146,60,0.12)',
      '--mod-btn-text': '#1e293b',
      '--mod-surface': 'rgba(255,255,255,0.78)',
    }}
    icon="⚛"
    titulo="Visualización molecular de la saponificación"
    subtitulo="Explora la reacción a nivel molecular con realidad aumentada. Identifica triglicéridos, NaOH, glicerol y jabón."
    objetivo="Explicar la reacción de saponificación a nivel molecular identificando las moléculas participantes e interpretar la ecuación química que representa el proceso."
    contenido={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.8rem', color: '#fb923c', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            ECUACIÓN QUÍMICA
        </div>
        <div style={{ fontFamily: 'monospace', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', lineHeight: '1.8', color: '#0f172a' }}>
            Triglicérido + 3 NaOH →<br />
            Glicerol + 3 Jabón (RCOONa)
        </div>
        <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.6', marginTop: '4px' }}>
            Moléculas: Triglicéridos · Hidróxido de sodio · Glicerol · Ácidos grasos
        </p>
        <button
          onClick={() => {
            console.log('Botón clicado, abriendo quiz')
            setShowQuiz(true)
          }}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#fb923c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.target.style.background = '#ea580c'}
          onMouseOut={(e) => e.target.style.background = '#fb923c'}
        >
          Realizar Quiz de Comprensión
        </button>
        </div>
    }
    instruccion="Activa la cámara para usar Realidad Aumentada. Apunta el teléfono al marcador impreso para ver las moléculas en tu espacio físico."
    prevPath="/modulo/2"
    nextPath={null}
    />
    {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
    </>
  )
}