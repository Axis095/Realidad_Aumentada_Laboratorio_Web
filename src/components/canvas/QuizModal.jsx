import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const questions = [
  {
    section: 'Pregunta 1 – Nivel macroscópico',
    questions: [
      {
        question: '¿Qué instrumento se utiliza para medir la masa del hidróxido de sodio?',
        options: ['A) Probeta', 'B) Embudo', 'C) Termómetro', 'D) Balanza'],
        correct: 3,
      },
      {
        question: '¿Qué sustancia se mezcla con el hidróxido de sodio para preparar la solución alcalina?',
        options: ['A) Alcohol', 'B) Agua destilada', 'C) Glicerina', 'D) Aceite vegetal'],
        correct: 1,
      },
      {
        question: '¿Cuál es la cantidad de hidróxido de sodio utilizada en la práctica de elaboración de jabón?',
        options: ['A) 50 g', 'B) 80 g', 'C) 110 g', 'D) 200 g'],
        correct: 2,
      },
      {
        question: '¿Cuál es la cantidad de agua destilada utilizada para preparar la solución alcalina?',
        options: ['A) 100 g', 'B) 150 g', 'C) 200 g', 'D) 250 g'],
        correct: 1,
      },
      {
        question: '¿Por qué el hidróxido de sodio debe agregarse al agua y no al revés?',
        options: ['A) Para evitar reacciones peligrosas', 'B) Para acelerar la reacción', 'C) Para enfriar la mezcla', 'D) Para cambiar el color del jabón'],
        correct: 0,
      },
      {
        question: '¿Qué cambio observable ocurre cuando comienza la reacción de saponificación?',
        options: ['A) La mezcla se vuelve líquida', 'B) La mezcla se espesa', 'C) El aceite desaparece', 'D) La mezcla cambia a color negro'],
        correct: 1,
      },
      {
        question: '¿Cómo se denomina el momento en que la mezcla comienza a espesarse?',
        options: ['A) Traza', 'B) Cristalización', 'C) Condensación', 'D) Evaporación'],
        correct: 0,
      },
    ],
  },
  {
    section: 'Sección 2. Comprensión del proceso químico',
    questions: [
      {
        question: 'La reacción de saponificación ocurre entre:',
        options: ['A) Alcohol y agua', 'B) Aceite y hidróxido de sodio', 'C) Sal y azúcar', 'D) Agua y oxígeno'],
        correct: 1,
      },
      {
        question: '¿Qué tipo de sustancias contienen los aceites utilizados para elaborar jabón?',
        options: ['A) Proteínas', 'B) Triglicéridos', 'C) Aminoácidos', 'D) Alcoholes'],
        correct: 1,
      },
      {
        question: '¿Cuál es uno de los productos que se obtiene en la reacción de saponificación?',
        options: ['A) Metano', 'B) Glicerina', 'C) Nitrógeno', 'D) Ácido sulfúrico'],
        correct: 1,
      },
      {
        question: 'El jabón que se forma en la reacción es químicamente:',
        options: ['A) Un ácido', 'B) Una sal de ácido graso', 'C) Un alcohol', 'D) Un gas'],
        correct: 1,
      },
      {
        question: '¿Por qué es importante agitar la mezcla durante el proceso?',
        options: ['A) Para enfriar el aceite', 'B) Para facilitar el contacto entre reactivos', 'C) Para evaporar el agua', 'D) Para eliminar el sodio'],
        correct: 1,
      },
    ],
  },
  {
    section: 'Sección 3. Nivel submicroscópico',
    questions: [
      {
        question: 'Los triglicéridos están formados por:',
        options: ['A) Tres moléculas de agua', 'B) Glicerol y tres ácidos grasos', 'C) Sodio y cloro', 'D) Carbono y nitrógeno'],
        correct: 1,
      },
      {
        question: 'Durante la reacción de saponificación ocurre principalmente:',
        options: ['A) Evaporación de moléculas', 'B) Ruptura de enlaces químicos', 'C) Formación de cristales', 'D) Oxidación del aceite'],
        correct: 1,
      },
      {
        question: 'El hidróxido de sodio provoca:',
        options: ['A) La ruptura de los enlaces del triglicérido', 'B) La evaporación del aceite', 'C) La congelación de la mezcla', 'D) La eliminación del oxígeno'],
        correct: 0,
      },
      {
        question: '¿Cuál de las siguientes moléculas se forma durante la reacción?',
        options: ['A) Glicerina', 'B) Metano', 'C) Cloro', 'D) Amoniaco'],
        correct: 0,
      },
    ],
  },
  {
    section: 'Sección 4. Nivel simbólico (Representación química)',
    questions: [
      {
        question: '¿Cuál de los siguientes representa la reacción general de saponificación?',
        options: ['A) Triglicérido + NaOH → Jabón + Glicerina', 'B) NaOH + HCl → NaCl + H₂O', 'C) CO₂ + H₂O → H₂CO₃', 'D) CH₄ + O₂ → CO₂ + H₂O'],
        correct: 0,
      },
      {
        question: 'En la ecuación química, NaOH representa:',
        options: ['A) Aceite vegetal', 'B) Hidróxido de sodio', 'C) Agua destilada', 'D) Glicerina'],
        correct: 1,
      },
      {
        question: 'La representación mediante fórmulas y ecuaciones químicas corresponde al nivel:',
        options: ['A) Macroscópico', 'B) Submicroscópico', 'C) Simbólico (Representación química)', 'D) Experimental'],
        correct: 2,
      },
      {
        question: 'Relacionar lo observado en el laboratorio con las moléculas y ecuaciones químicas permite:',
        options: ['A) Memorizar fórmulas', 'B) Comprender mejor los procesos químicos', 'C) Reducir el uso de reactivos', 'D) Eliminar la reacción química'],
        correct: 1,
      },
    ],
  },
]

function QuizModal({ onClose }) {
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  const animeRef = useRef(null)
  const modalRef = useRef(null)
  const STORAGE_KEY = 'quiz-draft'

  useEffect(() => {
    let mounted = true
    import('animejs').then(mod => {
      let a = mod
      try {
        if (mod && mod.default) a = mod.default
        if (a && typeof a === 'object' && typeof a.anime === 'function') a = a.anime
      } catch (e) {}
      if (!mounted || typeof a !== 'function') return
      animeRef.current = a
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  console.log('QuizModal renderizado')

  // load draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setAnswers(JSON.parse(raw))
    } catch (e) {}
  }, [])

  const handleAnswer = (sectionIndex, questionIndex, optionIndex, ev) => {
    setAnswers(prev => {
      const next = { ...prev, [`${sectionIndex}-${questionIndex}`]: optionIndex }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (e) {}
      return next
    })

    const section = questions[sectionIndex]
    const q = section.questions[questionIndex]
    const isCorrect = optionIndex === q.correct
    const run = animeRef.current
    const btn = ev && ev.currentTarget

    if (run && modalRef.current) {
      try {
        if (isCorrect) {
          run.timeline({}).add({ targets: modalRef.current, scale: [1, 1.02, 1], duration: 420, easing: 'easeOutCubic' })
          if (btn) run({ targets: btn, scale: [1, 1.08, 1], duration: 700, easing: 'easeOutElastic(1, .6)' })

          // append burst to inner card for visibility
          const card = modalRef.current.querySelector('div[style]') || modalRef.current
          const burst = document.createElement('div')
          burst.textContent = '✓'
          Object.assign(burst.style, {
            position: 'absolute',
            left: '50%',
            top: '12%',
            transform: 'translateX(-50%) scale(0)',
            background: '#10b981',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '999px',
            fontSize: '1rem',
            zIndex: 999999,
            pointerEvents: 'none',
          })
          card.appendChild(burst)
          run({ targets: burst, scale: [0, 1.05, 1], translateY: [-6, 0], opacity: [0,1], duration: 700, easing: 'easeOutElastic(1, .6)', complete: () => { try { burst.remove() } catch(e){} } })
        } else {
          run({ targets: modalRef.current, translateX: [0, -8, 8, -6, 6, 0], duration: 550, easing: 'easeInOutSine' })
          if (btn) run({ targets: btn, scale: [1, 0.97, 1], duration: 260, easing: 'easeOutQuad' })
        }
      } catch (e) { /* ignore animation errors */ }
    }
  }

  const calculateScore = () => {
    let correct = 0
    let total = 0
    questions.forEach((section, sIdx) => {
      section.questions.forEach((q, qIdx) => {
        total++
        if (answers[`${sIdx}-${qIdx}`] === q.correct) correct++
      })
    })
    return { correct, total }
  }

  const { correct, total } = calculateScore()

  // clear draft when showing results
  useEffect(() => {
    if (showResults) {
      try { sessionStorage.removeItem(STORAGE_KEY) } catch (e) {}
    }
  }, [showResults])

  const handleClose = () => {
    const hasAnswers = Object.keys(answers).length > 0 && !showResults
    if (hasAnswers) {
      const ok = window.confirm('Tienes respuestas sin enviar. Se guardarán temporalmente y podrás continuar después. ¿Cerrar?')
      if (!ok) return
    }
    onClose()
  }

  return createPortal(
    <div ref={modalRef} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      transformOrigin: 'center top'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Quiz de Saponificación</h2>
          <button onClick={handleClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
          }}>✕</button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
        }}>
          {questions.map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#fb923c', fontSize: '1.2rem', marginBottom: '1rem' }}>{section.section}</h3>
              {section.questions.map((q, qIdx) => (
                <div key={qIdx} style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>{q.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((option, oIdx) => {
                      const isSelected = answers[`${sIdx}-${qIdx}`] === oIdx
                      const isCorrect = oIdx === q.correct
                      const isAnswered = answers[`${sIdx}-${qIdx}`] !== undefined
                      let bgColor = 'transparent'
                      if (isAnswered) {
                        if (isSelected && isCorrect) bgColor = '#d1fae5'
                        else if (isSelected && !isCorrect) bgColor = '#fee2e2'
                        else if (isCorrect) bgColor = '#d1fae5'
                      }
                      return (
                        <button
                          key={oIdx}
                          onClick={(e) => handleAnswer(sIdx, qIdx, oIdx, e)}
                          disabled={isAnswered}
                          style={{
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            background: bgColor,
                            color: '#374151',
                            cursor: isAnswered ? 'default' : 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.2s',
                          }}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => { setShowResults(true); try { sessionStorage.removeItem(STORAGE_KEY) } catch(e){} }}
              style={{
                padding: '1rem 2rem',
                background: '#fb923c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Ver Resultados
            </button>
          </div>
          {showResults && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f3f4f6',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: '#1e293b' }}>Resultados</h3>
              <p style={{ fontSize: '1.2rem', color: '#374151' }}>
                Acertaste {correct} de {total} preguntas ({Math.round((correct / total) * 100)}%)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default QuizModal