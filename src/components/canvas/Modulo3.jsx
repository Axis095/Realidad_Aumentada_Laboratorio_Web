import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import ModuloBase from './ModuloBase'
import RouteLoader from '../ui/RouteLoader'
import useLabStore from '../../store/Uselabstore'
import './ModuloBase.css'
import './Aprendizaje.css'

const molecules = [
  {
    id: 'triglicerido',
    name: 'Triglicérido',
    formula: 'Grasa o aceite',
    kind: 'Reactivo orgánico',
    color: '#3974d8',
    nodes: ['G', 'R₁', 'R₂', 'R₃'],
    explanation: 'Está formado por una molécula de glicerol unida a tres cadenas de ácidos grasos mediante enlaces éster.',
    role: 'Aporta las tres cadenas grasas que terminarán formando las moléculas de jabón.',
  },
  {
    id: 'naoh',
    name: 'Hidróxido de sodio',
    formula: 'NaOH',
    kind: 'Reactivo alcalino',
    color: '#e96f32',
    nodes: ['Na⁺', 'OH⁻'],
    explanation: 'En agua se separa en iones. El ion hidróxido participa en la ruptura de los enlaces éster del triglicérido.',
    role: 'Permite separar el glicerol de las cadenas de ácidos grasos.',
  },
  {
    id: 'glicerol',
    name: 'Glicerol',
    formula: 'C₃H₈O₃',
    kind: 'Producto',
    color: '#218c68',
    nodes: ['OH', 'C₃', 'OH', 'OH'],
    explanation: 'Es una molécula con tres grupos alcohol que se libera cuando se rompen los enlaces del triglicérido.',
    role: 'Permanece como subproducto y aporta propiedades humectantes al jabón.',
  },
  {
    id: 'jabon',
    name: 'Jabón',
    formula: 'RCOO⁻ Na⁺',
    kind: 'Sal de ácido graso',
    color: '#8b5cf6',
    nodes: ['Na⁺', 'COO⁻', 'R'],
    explanation: 'Tiene una cabeza que interactúa con el agua y una larga cola que se relaciona con grasas y aceites.',
    role: 'Forma micelas capaces de rodear la suciedad grasa para facilitar su eliminación con agua.',
  },
]

const QuizModal = lazy(() => import('./QuizModal'))

function MoleculeDiagram({ molecule }) {
  return (
    <div className="molecule-diagram" style={{ '--molecule-color': molecule.color }} aria-label={`Representación simplificada de ${molecule.name}`}>
      <div className="molecule-orbit orbit-a" />
      <div className="molecule-orbit orbit-b" />
      {molecule.nodes.map((node, index) => (
        <React.Fragment key={`${node}-${index}`}>
          {index > 0 && <span className={`molecule-bond bond-${index}`} />}
          <span className={`molecule-node node-${index}`}>{node}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Modulo3() {
  const [showQuiz, setShowQuiz] = useState(false)
  const [challengeAnswer, setChallengeAnswer] = useState(null)
  const selectedId = useLabStore((state) => state.moleculaSeleccionada)
  const explored = useLabStore((state) => state.moleculasExploradas)
  const setMolecule = useLabStore((state) => state.setMolecula)
  const bestScore = useLabStore((state) => state.mejorPuntuacionQuiz)
  const explorerRef = useRef(null)
  const selected = molecules.find((molecule) => molecule.id === selectedId) ?? molecules[0]
  const quizUnlocked = explored.length >= molecules.length

  useEffect(() => {
    setMolecule(selected.id)
  }, [selected.id, setMolecule])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const diagram = explorerRef.current?.querySelector('.molecule-diagram')
    const copyItems = explorerRef.current?.querySelectorAll('.molecule-copy > *') ?? []
    const targets = [diagram, ...copyItems].filter(Boolean)
    if (!targets.length) return
    animate(targets, {
      opacity: [0, 1],
      scale: [0.92, 1],
      delay: stagger(40),
      duration: 430,
      ease: 'outCubic',
      composition: 'replace',
    })
  }, [selected.id])

  const openQuiz = () => {
    if (!quizUnlocked) return
    setShowQuiz(true)
  }

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
        titulo="Explorador molecular de la saponificación"
        subtitulo="Conecta lo que observas en el laboratorio con las partículas y símbolos que explican la transformación química."
        objetivo="Identificar reactivos y productos, explicar la función de cada especie e interpretar la ecuación general de saponificación."
        contenido={
          <div className="symbolic-equation">
            <span>Triglicérido</span><b>+</b><span>3 NaOH</span><b>→</b><span>Glicerol</span><b>+</b><span>3 RCOONa</span>
          </div>
        }
        instruccion="Explora las cuatro especies moleculares. Después responde el reto rápido y realiza el cuestionario de comprensión."
        prevPath="/modulo/2"
        nextPath={null}
      >
        <section className="learning-lab molecular-lab" ref={explorerRef}>
          <div className="molecule-tabs" role="tablist" aria-label="Especies químicas">
            {molecules.map((molecule) => (
              <button
                type="button"
                role="tab"
                aria-selected={selected.id === molecule.id}
                key={molecule.id}
                className={`${selected.id === molecule.id ? 'active' : ''} ${explored.includes(molecule.id) ? 'visited' : ''}`}
                style={{ '--molecule-color': molecule.color }}
                onClick={() => setMolecule(molecule.id)}
              >
                <span>{explored.includes(molecule.id) ? '✓' : '○'}</span>{molecule.name}
              </button>
            ))}
          </div>

          <div className="molecule-stage">
            <MoleculeDiagram molecule={selected} />
            <article className="molecule-copy">
              <span className="learning-kicker">{selected.kind}</span>
              <h3>{selected.name}</h3>
              <code>{selected.formula}</code>
              <p>{selected.explanation}</p>
              <div className="concept-card"><b>Función en la reacción</b><span>{selected.role}</span></div>
            </article>
          </div>

          <div className="representation-levels">
            <div><span>👀</span><b>Macroscópico</b><p>La mezcla se espesa y forma una traza.</p></div>
            <div><span>🔎</span><b>Submicroscópico</b><p>Se rompen enlaces y se reorganizan partículas.</p></div>
            <div><span>🧮</span><b>Simbólico</b><p>La ecuación representa reactivos y productos.</p></div>
          </div>

          <div className="quick-challenge">
            <div><span className="learning-kicker">Reto rápido</span><h4>¿Qué producto posee una parte que interactúa con agua y otra con grasa?</h4></div>
            <div className="challenge-options">
              {['Glicerol', 'Jabón', 'NaOH'].map((answer) => (
                <button
                  type="button"
                  key={answer}
                  className={challengeAnswer === answer ? (answer === 'Jabón' ? 'correct' : 'incorrect') : ''}
                  onClick={() => setChallengeAnswer(answer)}
                >{answer}</button>
              ))}
            </div>
            {challengeAnswer && <p className="challenge-feedback">{challengeAnswer === 'Jabón' ? '✓ Correcto: esa estructura permite formar micelas.' : 'Inténtalo nuevamente: piensa en la molécula que limpia grasa.'}</p>}
          </div>

          <footer className="molecule-footer">
            <div>
              <strong>{explored.length}/4 especies exploradas</strong>
              <small>{bestScore === null ? 'Aún no realizas el quiz.' : `Mejor resultado: ${bestScore}%`}</small>
            </div>
            <button type="button" className="learning-btn primary orange" onClick={openQuiz} disabled={!quizUnlocked}>
              {quizUnlocked ? 'Realizar quiz →' : `Explora ${molecules.length - explored.length} más para desbloquear`}
            </button>
          </footer>
        </section>
      </ModuloBase>
      {showQuiz && <Suspense fallback={<RouteLoader compact />}><QuizModal onClose={() => setShowQuiz(false)} /></Suspense>}
    </>
  )
}
