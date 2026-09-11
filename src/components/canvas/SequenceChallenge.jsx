import React, { useRef, useState } from 'react'
import { animate } from 'animejs'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'

const processOrder = [
  { id: 'alkaline', label: 'Preparar solución alcalina' },
  { id: 'oil', label: 'Mezclar con el aceite' },
  { id: 'stir', label: 'Agitar la mezcla' },
  { id: 'trace', label: 'Identificar la traza' },
  { id: 'mold', label: 'Verter en el molde' },
]

const initialOrder = ['trace', 'alkaline', 'mold', 'stir', 'oil']

function getInitialCards() {
  return initialOrder.map((id) => processOrder.find((item) => item.id === id))
}

export default function SequenceChallenge({ completed, onComplete }) {
  const { profile } = usePerformanceProfile()
  const challengeRef = useRef(null)
  const [available, setAvailable] = useState(getInitialCards)
  const [answer, setAnswer] = useState([])
  const [feedback, setFeedback] = useState('')
  const [solved, setSolved] = useState(completed)

  const addStep = (item) => {
    setAvailable((current) => current.filter((candidate) => candidate.id !== item.id))
    setAnswer((current) => [...current, item])
    setFeedback('')
  }

  const removeStep = (item) => {
    setAnswer((current) => current.filter((candidate) => candidate.id !== item.id))
    setAvailable((current) => [...current, item])
    setFeedback('')
  }

  const reset = () => {
    setAvailable(getInitialCards())
    setAnswer([])
    setFeedback('')
    setSolved(false)
  }

  const checkAnswer = () => {
    const isCorrect = answer.every((item, index) => item.id === processOrder[index].id)
    setFeedback(isCorrect
      ? '¡Secuencia correcta! Ya relacionas las etapas principales del proceso.'
      : 'Aún hay etapas fuera de lugar. Retira las tarjetas que quieras cambiar e inténtalo otra vez.')

    if (isCorrect) {
      setSolved(true)
      onComplete()
    }

    if (profile !== 'reduced' && challengeRef.current) {
      animate(challengeRef.current, isCorrect
        ? { scale: [1, 1.012, 1], duration: 380, ease: 'outCubic' }
        : { translateX: [0, -5, 5, -3, 3, 0], duration: 360, ease: 'inOutSine' })
    }
  }

  return (
    <section className={`sequence-challenge ${solved ? 'is-solved' : ''}`} ref={challengeRef} aria-labelledby="sequence-title">
      <div className="sequence-heading">
        <div>
          <span className="learning-kicker">Actividad · Ordenar el proceso</span>
          <h4 id="sequence-title">Construye la secuencia de saponificación</h4>
          <p>Toca las tarjetas en el orden correcto. Puedes tocar una respuesta para devolverla.</p>
        </div>
        <span className="sequence-score" aria-label={`${solved ? 5 : answer.length} de 5 etapas colocadas`}>{solved ? 5 : answer.length}/5</span>
      </div>

      {solved ? (
        <div className="sequence-success" role="status">
          <span aria-hidden="true">✓</span>
          <div><strong>Reto completado</strong><p>La secuencia quedó registrada en tu progreso.</p></div>
          <button type="button" onClick={reset}>Practicar otra vez</button>
        </div>
      ) : (
        <>
          <ol className="sequence-answer" aria-label="Secuencia construida">
            {processOrder.map((_, index) => {
              const item = answer[index]
              return (
                <li key={index} className={item ? 'filled' : ''}>
                  <span>{index + 1}</span>
                  {item
                    ? <button type="button" onClick={() => removeStep(item)} aria-label={`Retirar ${item.label}`}>{item.label}</button>
                    : <small>Selecciona una etapa</small>}
                </li>
              )
            })}
          </ol>

          <div className="sequence-bank" aria-label="Etapas disponibles">
            {available.map((item) => (
              <button type="button" key={item.id} onClick={() => addStep(item)}>{item.label}</button>
            ))}
          </div>

          <div className="sequence-actions">
            <button type="button" className="learning-btn secondary" onClick={reset} disabled={!answer.length}>Reiniciar</button>
            <button type="button" className="learning-btn primary green" onClick={checkAnswer} disabled={answer.length !== processOrder.length}>Comprobar orden</button>
          </div>
          {feedback && <p className={`sequence-feedback ${answer.every((item, index) => item.id === processOrder[index]?.id) ? 'correct' : ''}`} role="status">{feedback}</p>}
        </>
      )}
    </section>
  )
}
