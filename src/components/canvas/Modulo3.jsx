import React, { useState, useRef } from 'react'
import ModuloBase from './ModuloBase'
import QuizModal from './QuizModal'
import './ModuloBase.css'
import { animate } from 'animejs'

export default function Modulo3() {
  const [showQuiz, setShowQuiz] = useState(false)
  const quizBtnRef = useRef(null)

return (
    <>
    <ModuloBase
    num="3"
    color="#e96f32"
    pageStyle={{
      '--mod-page-bg': '#fff6ef',
      '--mod-page-text': '#183b3a',
      '--mod-info-text': '#526b68',
      '--mod-header-start': 'rgba(233,111,50,0.11)',
      '--mod-info-bg': 'rgba(255,255,255,0.92)',
      '--mod-info-border': 'rgba(233,111,50,0.15)',
      '--mod-btn-text': '#ffffff',
      '--mod-surface': '#ffffff',
    }}
    icon="⚛"
    titulo="Visualización molecular de la saponificación"
    subtitulo="Explora la reacción a nivel molecular con realidad aumentada. Identifica triglicéridos, NaOH, glicerol y jabón."
    objetivo="Explicar la reacción de saponificación a nivel molecular identificando las moléculas participantes e interpretar la ecuación química que representa el proceso."
    contenido={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--clr-orange)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            ECUACIÓN QUÍMICA
        </div>
        <div style={{ fontFamily: 'monospace', background: 'var(--clr-orange-soft)', border: '1px solid rgba(233,111,50,.22)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem', lineHeight: '1.8', color: 'var(--clr-text)' }}>
            Triglicérido + 3 NaOH →<br />
            Glicerol + 3 Jabón (RCOONa)
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: '1.6', marginTop: '4px' }}>
            Moléculas: Triglicéridos · Hidróxido de sodio · Glicerol · Ácidos grasos
        </p>
        <button
          ref={quizBtnRef}
          onClick={() => {
            const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            if (quizBtnRef.current && !reduceMotion) {
              animate(
                quizBtnRef.current,
                {
                  scale: [1, 1.06, 1],
                  duration: 500,
                  ease: 'inOutSine',
                  onComplete: () => setShowQuiz(true),
                }
              )
            } else {
              setShowQuiz(true)
            }
          }}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--clr-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--clr-orange-dark)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--clr-orange)'}
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
