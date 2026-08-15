import React, { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import ModuloBase from './ModuloBase'
import useLabStore from '../../store/Uselabstore'
import './ModuloBase.css'
import './Aprendizaje.css'

const steps = [
  {
    title: 'Medición y filtrado del aceite',
    short: 'Preparar aceite',
    icon: '🫗',
    description: 'Filtra el aceite de cocina usado para retirar residuos y mide la cantidad indicada por el protocolo.',
    concept: 'Una medición constante permite calcular correctamente la cantidad de hidróxido de sodio.',
    safety: 'El aceite debe estar frío y libre de restos de alimento.',
    metric: 'Materia prima limpia',
    visual: 'oil',
  },
  {
    title: 'Preparación de la solución alcalina',
    short: 'Preparar NaOH',
    icon: '🥽',
    description: 'Añade lentamente el NaOH al agua destilada mientras mezclas con cuidado. La disolución libera calor.',
    concept: 'La disolución es exotérmica: su temperatura aumenta sin aplicar una fuente externa de calor.',
    safety: 'Siempre agrega NaOH al agua, nunca agua sobre NaOH. Usa guantes y gafas.',
    metric: 'Reacción exotérmica',
    visual: 'alkaline',
  },
  {
    title: 'Mezcla y agitación controlada',
    short: 'Mezclar',
    icon: '🥄',
    description: 'Incorpora la solución alcalina al aceite y agita de forma continua para favorecer el contacto entre reactivos.',
    concept: 'La mezcla comienza a emulsionarse y aumenta progresivamente su viscosidad.',
    safety: 'Evita salpicaduras y mantén el recipiente sobre una superficie estable.',
    metric: 'Emulsión uniforme',
    visual: 'mix',
  },
  {
    title: 'Control de temperatura y traza',
    short: 'Observar traza',
    icon: '🌡️',
    description: 'Controla la temperatura y observa la traza: el punto donde la mezcla deja una marca breve sobre su superficie.',
    concept: 'La traza indica que la emulsión es estable y la saponificación está avanzando.',
    safety: 'No toques ni pruebes la mezcla; todavía puede contener álcali sin reaccionar.',
    metric: 'Textura de crema ligera',
    visual: 'temperature',
  },
  {
    title: 'Moldeo, reposo y curado',
    short: 'Moldear',
    icon: '🧼',
    description: 'Vierte la mezcla en moldes, déjala solidificar y respeta el tiempo de curado antes de utilizar el jabón.',
    concept: 'Durante el curado disminuye el agua y continúa estabilizándose el producto.',
    safety: 'Etiqueta el molde y evita manipular el jabón antes del tiempo indicado por el docente.',
    metric: 'Producto en formación',
    visual: 'mold',
  },
]

function ProcessVisual({ step }) {
  return (
    <div className={`process-visual visual-${step.visual}`} aria-hidden="true">
      <div className="lab-surface" />
      <div className="visual-vessel">
        <div className="visual-liquid" />
        <div className="visual-wave wave-a" />
        <div className="visual-wave wave-b" />
      </div>
      <div className="visual-tool">{step.icon}</div>
      <div className="visual-bubble bubble-a" />
      <div className="visual-bubble bubble-b" />
      <div className="visual-bubble bubble-c" />
      <div className="visual-temperature"><span /></div>
      <div className="visual-molds"><span /><span /><span /></div>
    </div>
  )
}

export default function Modulo2() {
  const pasoActual = useLabStore((state) => state.pasoActual)
  const explored = useLabStore((state) => state.pasosModulo2Explorados)
  const visitarPaso = useLabStore((state) => state.visitarPasoModulo2)
  const completarModulo = useLabStore((state) => state.completarModulo)
  const stageRef = useRef(null)
  const step = steps[pasoActual]

  useEffect(() => {
    visitarPaso(pasoActual)
  }, [pasoActual, visitarPaso])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const visual = stageRef.current?.querySelector('.process-visual')
    const copyItems = stageRef.current?.querySelectorAll('.process-copy > *') ?? []
    const targets = [visual, ...copyItems].filter(Boolean)
    if (!targets.length) return
    animate(targets, {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(35),
      duration: 420,
      ease: 'outCubic',
      composition: 'replace',
    })
  }, [pasoActual])

  const selectStep = (index) => visitarPaso(index)
  const nextStep = () => selectStep(Math.min(pasoActual + 1, steps.length - 1))
  const previousStep = () => selectStep(Math.max(pasoActual - 1, 0))
  const complete = () => completarModulo(2)

  return (
    <ModuloBase
      num="2"
      color="#218c68"
      pageStyle={{
        '--mod-page-bg': '#f1faf5',
        '--mod-page-text': '#183b3a',
        '--mod-info-text': '#526b68',
        '--mod-header-start': 'rgba(33,140,104,0.11)',
        '--mod-info-bg': 'rgba(255,255,255,0.9)',
        '--mod-info-border': 'rgba(33,140,104,0.14)',
        '--mod-btn-text': '#ffffff',
        '--mod-surface': '#ffffff',
      }}
      icon="🔬"
      titulo="Proceso guiado de saponificación"
      subtitulo="Recorre el procedimiento, relaciona cada cambio observable con su explicación química y revisa las medidas de seguridad."
      objetivo="Describir las etapas de la saponificación y reconocer los cambios observables, las condiciones de trabajo y las precauciones de cada etapa."
      contenido={
        <div className="learning-summary">
          <strong>{explored.length}/5 etapas exploradas</strong>
          <div className="learning-mini-track"><span style={{ width: `${(explored.length / steps.length) * 100}%` }} /></div>
          <small>El avance se guarda automáticamente.</small>
        </div>
      }
      instruccion="Selecciona una etapa en la línea de tiempo. Lee qué ocurre, por qué ocurre y la precaución correspondiente antes de avanzar."
      prevPath="/modulo/1"
      nextPath="/modulo/3"
    >
      <section className="learning-lab process-lab" ref={stageRef}>
        <nav className="step-timeline" aria-label="Etapas de saponificación">
          {steps.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={`${index === pasoActual ? 'active' : ''} ${explored.includes(index) ? 'visited' : ''}`}
              onClick={() => selectStep(index)}
              aria-current={index === pasoActual ? 'step' : undefined}
            >
              <span className="step-number">{explored.includes(index) ? '✓' : index + 1}</span>
              <span>{item.short}</span>
            </button>
          ))}
        </nav>

        <div className="process-stage">
          <ProcessVisual step={step} />
          <article className="process-copy">
            <span className="learning-kicker">Etapa {pasoActual + 1} de {steps.length}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <div className="concept-card"><b>¿Qué está ocurriendo?</b><span>{step.concept}</span></div>
            <div className="safety-card"><b>🛡️ Seguridad</b><span>{step.safety}</span></div>
            <div className="stage-metric"><span>Cambio clave</span><strong>{step.metric}</strong></div>
          </article>
        </div>

        <footer className="learning-controls">
          <button type="button" className="learning-btn secondary" onClick={previousStep} disabled={pasoActual === 0}>← Anterior</button>
          <span>{pasoActual + 1} / {steps.length}</span>
          {pasoActual < steps.length - 1 ? (
            <button type="button" className="learning-btn primary green" onClick={nextStep}>Siguiente etapa →</button>
          ) : (
            <button type="button" className="learning-btn primary green" onClick={complete} disabled={explored.length < steps.length}>
              {explored.length < steps.length ? `Explora ${steps.length - explored.length} etapa(s) más` : 'Completar módulo ✓'}
            </button>
          )}
        </footer>
      </section>
    </ModuloBase>
  )
}
