import React, { memo, useEffect, useRef, useState } from 'react'
// Shared visual treatment only: the AR detector and its metrics are not imported.
import '../ar/ARDiagnostics.css'

const show = (value, unit = '') => value === null || value === undefined ? '—' : `${value}${unit}`
const states = { loading: 'Preparando', playing: 'Reproduciendo', paused: 'En pausa · render bajo demanda', completed: 'Escena terminada', closed: 'Visor cerrado · última muestra', error: 'Error · última muestra' }
const captureKey = (sample, error, profile) => JSON.stringify([profile, error, sample?.sceneId, sample?.profile, sample?.state, sample?.readyMs, sample?.measurement?.measuredAt, sample?.error])

function ProcessDiagnostics({ diagnosticsRef, enabledRef, profile, status, error }) {
  const [open, setOpen] = useState(false)
  const [sample, setSample] = useState(null)
  const [device, setDevice] = useState('')
  const [report, setReport] = useState('')
  const [message, setMessage] = useState('')
  const reportKey = useRef(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  useEffect(() => {
    let timer
    const sync = () => {
      clearInterval(timer)
      const enabled = open && !document.hidden
      enabledRef.current = enabled
      diagnosticsRef.current?.setEnabled(enabled)
      if (enabled) {
        const update = () => setSample(diagnosticsRef.current?.getSnapshot() || null)
        update()
        timer = setInterval(update, 1000)
      }
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      enabledRef.current = false
      diagnosticsRef.current?.setEnabled(false)
    }
  }, [open, diagnosticsRef, enabledRef])

  // A previous export must not look like the result of a new test.
  useEffect(() => {
    if (reportKey.current !== null && reportKey.current !== captureKey(sample, error, profile)) {
      reportKey.current = null
      setReport('')
      setMessage('')
    }
  }, [sample, error, profile])

  async function copyReport() {
    const snapshot = diagnosticsRef.current?.getSnapshot() || null
    setSample(snapshot)
    const failure = error || snapshot?.error || null
    // Recheck live data: polling may still show the sample preceding a reset.
    if (!failure && !(snapshot?.measurement?.frames > 0)) {
      reportKey.current = null
      setReport('')
      setMessage('Aún no hay una medición. Reproduce la escena con este panel abierto durante al menos dos segundos.')
      return
    }
    const key = captureKey(snapshot, error, profile)
    reportKey.current = key
    const text = JSON.stringify({
      diagnosticVersion: 2, experience: 'module-2-process', capturedAt: new Date().toISOString(),
      resultType: failure ? 'error' : 'measurement',
      device: device.trim() || 'No indicado', browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: window.devicePixelRatio },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType ?? null,
        saveData: navigator.connection.saveData ?? null,
      } : null,
      selectedProfile: profile, status, error: failure,
      runtime: snapshot,
      notes: 'FPS = renders de animación enviados, no refresco de pantalla ni tiempo GPU. CPU = actualización de escena y envío del render. Pausa/fin/cierre conservan la última muestra completa. Carga GLB incluye descarga y preparación (puede usar caché); inicio incluye importación del motor. Recursos = último render; bytes GLB no son RAM. Sin cámara, telemetría remota ni medición de temperatura/RAM total.',
    }, null, 2)
    setReport(text)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      if (mounted.current && reportKey.current === key) setMessage('Resultado copiado al portapapeles.')
    } catch {
      if (mounted.current && reportKey.current === key) setMessage('No se pudo copiar automáticamente. Selecciona y copia el texto de abajo.')
    }
  }

  const measurement = sample?.measurement
  const live = sample?.state === 'playing'
  const failure = error || sample?.error
  const canCopy = Boolean(failure || measurement?.frames > 0)
  const guidance = failure ? 'Prueba interrumpida. Puedes copiar el informe de error y reintentar.'
    : measurement?.frames > 0 ? 'Resultado disponible. Puedes copiarlo o repetir la prueba.'
      : status === 'loading' || sample?.state === 'loading' ? 'Preparando el visor. Espera a que termine de cargar.'
        : live ? 'Midiendo… Mantén la escena en reproducción al menos dos segundos.'
          : !sample || sample.state === 'closed' ? 'Sin medición. Abre el visor y reproduce una escena.'
            : 'Sin medición. Pulsa Reproducir y espera al menos dos segundos.'
  return <details className="ar-diagnostics process-diagnostics" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Prueba de rendimiento <span>Opcional</span></summary>
    {open && <div className="ar-diagnostics-body">
      <p>Abre el visor, elige la calidad y la escena y pulsa Reproducir. Mantén este panel abierto hasta que termine y copia el resultado. Repite con la otra calidad para comparar.</p>
      <p id="process-test-guidance" className="process-test-guidance" role="status">{guidance}</p>
      <dl>
        <div><dt>Escena / avance</dt><dd>{show(sample?.sceneTitle)} / {show(sample?.progress, ' %')}</dd></div>
        <div><dt>Perfil de la sesión</dt><dd>{sample ? sample.profile === 'reduced' ? 'Ligero' : 'Completo' : 'Sin iniciar'}</dd></div>
        <div><dt>Estado</dt><dd data-testid="process-diagnostic-state">{sample ? states[sample.state] : 'Sin iniciar'}</dd></div>
        <div><dt>{live ? 'FPS de animación / límite' : 'Últimos FPS de reproducción / límite'}</dt><dd data-testid="process-diagnostic-fps">{show(measurement?.renderedFps)} / {show(sample?.targetFps)} FPS</dd></div>
        <div><dt>Render CPU medio / máximo</dt><dd>{show(measurement?.renderCpuMeanMs, ' ms')} / {show(measurement?.renderCpuMaxMs, ' ms')}</dd></div>
        <div><dt>Duración de la última muestra</dt><dd>{measurement ? `${(measurement.windowMs / 1000).toFixed(1)} s · ${measurement.frames} fotogramas` : '—'}</dd></div>
        <div><dt>Resolución / escala de píxeles</dt><dd>{show(sample?.renderResolution)} / {show(sample?.pixelRatio)}</dd></div>
        <div><dt>Carga y preparación de modelos</dt><dd>{show(sample?.modelsLoadMs, ' ms')}{sample?.modelBytes != null && ` · ${(sample.modelBytes / 1048576).toFixed(2)} MiB`}</dd></div>
        <div><dt>Inicio completo del visor</dt><dd>{show(sample?.readyMs, ' ms')}</dd></div>
        <div><dt>Último render: llamadas / triángulos</dt><dd>{show(sample?.drawCalls)} / {show(sample?.triangles)}</dd></div>
      </dl>
      <p>Actualización cada segundo. Al pausar o terminar se conserva la última muestra; no es el promedio de toda la escena. Cambiar de escena, reiniciar o cambiar de calidad borra la medición anterior.</p>
      <p>Límites: 20 FPS en Ligero y 30 en Completo. CPU mide solo la actualización y el envío del render, no la GPU ni toda la página. La carga puede usar caché; los bytes del modelo no indican memoria RAM.</p>
      {(error || sample?.error) && <p className="ar-diagnostics-error">Último error: {error || sample.error}</p>}
      <label htmlFor="process-diagnostic-device">Teléfono probado (opcional)</label>
      <input id="process-diagnostic-device" maxLength={100} value={device} onChange={event => setDevice(event.target.value)} placeholder="Ej.: Samsung Galaxy A04" />
      <button type="button" disabled={!canCopy} aria-describedby="process-test-guidance" onClick={copyReport}>{failure ? 'Copiar informe de error' : 'Copiar resultado'}</button>
      <p>Prueba local, sin cámara ni envío automático de datos. El resultado incluye escena, calidad, navegador y pantalla.</p>
      <p role="status">{message}</p>
      {report && <label>Resultado capturado (copia fija)
        <textarea readOnly rows={7} value={report} onFocus={event => event.target.select()} />
      </label>}
    </div>}
  </details>
}

export default memo(ProcessDiagnostics)
