import React, { useEffect, useRef, useState } from 'react'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import { PROCESS_SCENES } from './processPrototypeState'
import ProcessDiagnostics from './ProcessDiagnostics'
import './ProcessPrototype.css'

const initialPlayback = { sceneId: 'fill', progress: 0, playing: false, completed: false }

export default function ProcessPrototype({ children }) {
  const { profile } = usePerformanceProfile()
  const [enabled, setEnabled] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [playback, setPlayback] = useState(initialPlayback)
  const containerRef = useRef(null)
  const sectionRef = useRef(null)
  const runtimeRef = useRef(null)
  const diagnosticsRef = useRef(null)
  const diagnosticsEnabledRef = useRef(false)
  const profileRef = useRef(profile)
  const visibleRef = useRef(true)
  const playbackRef = useRef(initialPlayback)
  const selected = PROCESS_SCENES.find(item => item.id === playback.sceneId)

  useEffect(() => {
    profileRef.current = profile
    runtimeRef.current?.setQuality(profile === 'reduced')
  }, [profile])

  useEffect(() => {
    if (!enabled) return
    const startedAt = performance.now()
    diagnosticsRef.current = null
    const controller = new AbortController()
    let runtime
    setStatus('loading')
    setError('')
    setNotice('')
    setPlayback(initialPlayback)
    playbackRef.current = initialPlayback
    const fail = failure => {
      if (controller.signal.aborted) return
      setStatus('error')
      setError(failure.message)
    }
    async function start() {
      try {
        const { createProcessPrototype } = await import('./processPrototypeRuntime')
        if (controller.signal.aborted) return
        runtime = await createProcessPrototype({
          container: containerRef.current,
          signal: controller.signal,
          reduced: profileRef.current === 'reduced',
          startedAt,
          diagnosticsEnabled: diagnosticsEnabledRef.current,
          onDiagnosticsReady: handle => {
            if (!controller.signal.aborted) diagnosticsRef.current = handle
          },
          onError: fail,
          onStatus: next => {
            if (!controller.signal.aborted) { setStatus(next); if (next !== 'error') setError('') }
          },
          onChange: next => {
            if (controller.signal.aborted) return
            playbackRef.current = next
            setPlayback(next)
          },
        })
        if (controller.signal.aborted) { runtime.dispose(); return }
        runtimeRef.current = runtime
        runtime.setQuality(profileRef.current === 'reduced')
        setStatus('ready')
      } catch (failure) { fail(failure) }
    }
    start()
    return () => {
      controller.abort()
      runtime?.dispose()
      runtimeRef.current = null
    }
  }, [enabled, attempt])

  useEffect(() => {
    const pause = () => {
      if (!playbackRef.current.playing) return
      runtimeRef.current?.pause()
      setNotice('Pausamos la animación al dejar de ver el panel. Pulsa Reproducir para continuar.')
    }
    const onVisibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', onVisibility)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      visibleRef.current = entries[0].isIntersecting
      if (!visibleRef.current) pause()
    })
    if (sectionRef.current) observer?.observe(sectionRef.current)
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const act = action => { setNotice(''); runtimeRef.current?.[action]() }
  const ready = status === 'ready'
  return (
    <section className="process-prototype" ref={sectionRef} aria-labelledby="process-prototype-title">
      <header className="process-prototype-heading">
        <span className="learning-kicker">PROTOTIPO INTERACTIVO · OPCIONAL</span>
        <h3 id="process-prototype-title">Del aceite a la mezcla</h3>
        <p>Explora tres movimientos del proceso a tu ritmo. Este visor no sustituye las cinco etapas ni el reto de aprendizaje.</p>
      </header>
      {!enabled ? <div className="process-prototype-intro">
        {children && <div className="process-prototype-scheme"><p>Esquema de la etapa seleccionada</p>{children}</div>}
        <ol><li>Llenar el vaso</li><li>Verter la solución</li><li>Agitar la mezcla</li></ol>
        <button type="button" onClick={() => setEnabled(true)}>Abrir prototipo 3D</button>
        <p>El visor sustituye al esquema. Carga solo los recursos necesarios: unos 1,2 MiB para llenado y menos de 160 KB para cada animación adicional.</p>
      </div> : <>
        <div className="process-prototype-toolbar">
          <span>{profile === 'reduced' ? 'Ligero · hasta 20 FPS' : 'Completo · hasta 30 FPS'}</span>
          <button type="button" className="process-prototype-secondary" onClick={() => { setEnabled(false); setStatus('idle') }}>Cerrar prototipo 3D</button>
        </div>
        <div className="process-prototype-scenes" role="group" aria-label="Escenas del prototipo">
          {PROCESS_SCENES.map((item, index) => <button type="button" key={item.id} disabled={!runtimeRef.current}
            aria-pressed={playback.sceneId === item.id} onClick={() => { setNotice(''); runtimeRef.current?.select(item.id) }}>
            <span>{index + 1}</span> {item.title}
          </button>)}
        </div>
        <div className="process-prototype-stage" data-status={status} data-scene={playback.sceneId} data-playing={playback.playing}>
          <div className="process-prototype-canvas" ref={containerRef} />
          <span className="process-prototype-caption">{selected.title} · representación esquemática</span>
          {status === 'loading' && <p className="process-prototype-overlay" role="status">Preparando escena…</p>}
          {status === 'error' && <div className="process-prototype-overlay">
            <p role="alert">{error}</p>
            <button type="button" onClick={() => {
              if (runtimeRef.current && playback.sceneId !== 'fill' && diagnosticsRef.current?.getSnapshot().running) runtimeRef.current.select(playback.sceneId)
              else setAttempt(value => value + 1)
            }}>Reintentar prototipo</button>
            <span>La explicación y las actividades del módulo siguen disponibles.</span>
          </div>}
        </div>
        <p className="process-prototype-description">{selected.description}</p>
        <p className="process-prototype-observation">{selected.observation}</p>
        <div className="process-prototype-controls" role="group" aria-label="Reproducción del prototipo">
          <button type="button" disabled={!ready || playback.playing} onClick={() => {
            if (!document.hidden && visibleRef.current) act('play')
          }}>Reproducir</button>
          <button type="button" className="process-prototype-secondary" disabled={!ready || !playback.playing} onClick={() => act('pause')}>Pausar</button>
          <button type="button" className="process-prototype-secondary" disabled={!ready} onClick={() => act('reset')}>Reiniciar</button>
        </div>
        <label className="process-prototype-progress" htmlFor="process-prototype-progress">
          <span>Avance de la escena <output>{Math.round(playback.progress * 100)} %</output></span>
          <input id="process-prototype-progress" type="range" min="0" max="100" step="1" disabled={!ready}
            value={Math.round(playback.progress * 100)} onChange={event => { setNotice(''); runtimeRef.current?.seek(Number(event.target.value) / 100) }} />
        </label>
        <p className="process-prototype-playback" role="status">{notice || (ready ? playback.playing ? 'Reproduciendo' : playback.completed ? 'Escena terminada. Puedes repetirla o elegir otra.' : 'En pausa. Reproduce o mueve el control de avance para observar sin movimiento continuo.' : '')}</p>
      </>}
      <ProcessDiagnostics diagnosticsRef={diagnosticsRef} enabledRef={diagnosticsEnabledRef} profile={profile} status={status} error={error} />
      <p className="process-prototype-safety">Simulación educativa: niveles, colores y duración son ilustrativos, sin cálculo de cantidades ni física de fluidos. No es una receta ni una indicación para manipular sustancias sin supervisión docente.</p>
    </section>
  )
}
