import React, { memo, useEffect, useRef, useState } from 'react'
// Shared visual treatment only: the AR detector and its metrics are not imported.
import '../ar/ARDiagnostics.css'

const show = (value, unit = '') => value === null || value === undefined ? '—' : `${value}${unit}`
const states = { loading: 'Preparando', playing: 'Reproduciendo', paused: 'En pausa · render bajo demanda', completed: 'Escena terminada', closed: 'Visor cerrado · última muestra', error: 'Error · última muestra' }

function ProcessDiagnostics({ diagnosticsRef, enabledRef, profile, status, error }) {
  const [open, setOpen] = useState(false)
  const [sample, setSample] = useState(null)
  const [device, setDevice] = useState('')
  const [report, setReport] = useState('')
  const [message, setMessage] = useState('')
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

  async function copyReport() {
    const snapshot = diagnosticsRef.current?.getSnapshot() || null
    const text = JSON.stringify({
      diagnosticVersion: 1, experience: 'module-2-process', capturedAt: new Date().toISOString(),
      device: device.trim() || 'No indicado', browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: window.devicePixelRatio },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType ?? null,
        saveData: navigator.connection.saveData ?? null,
      } : null,
      selectedProfile: profile, status, error: error || snapshot?.error || null,
      runtime: snapshot,
      notes: 'FPS = renders de animación enviados, no refresco de pantalla ni tiempo GPU. CPU = actualización de escena y envío del render. Pausa/fin/cierre conservan la última muestra completa. Carga GLB incluye descarga y preparación (puede usar caché); inicio incluye importación del motor. Recursos = último render; bytes GLB no son RAM. Sin cámara, telemetría remota ni medición de temperatura/RAM total.',
    }, null, 2)
    setReport(text)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      if (mounted.current) setMessage('Informe copiado. Puedes pegarlo en el chat.')
    } catch {
      if (mounted.current) setMessage('No se pudo copiar automáticamente. Selecciona y copia el texto de abajo.')
    }
  }

  const measurement = sample?.measurement
  const live = sample?.state === 'playing'
  return <details className="ar-diagnostics process-diagnostics" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Diagnóstico del prototipo <span>Opcional</span></summary>
    {open && <div className="ar-diagnostics-body">
      <p>Abre el visor y reproduce una escena al menos dos segundos. El panel se actualiza una vez por segundo; abrirlo no inicia el 3D ni la animación.</p>
      <dl>
        <div><dt>Escena / avance</dt><dd>{show(sample?.sceneTitle)} / {show(sample?.progress, ' %')}</dd></div>
        <div><dt>Perfil de la sesión</dt><dd>{sample ? sample.profile === 'reduced' ? 'Ligero' : 'Completo' : 'Sin iniciar'}</dd></div>
        <div><dt>Estado</dt><dd data-testid="process-diagnostic-state">{sample ? states[sample.state] : 'Sin iniciar'}</dd></div>
        <div><dt>{live ? 'FPS de animación / límite' : 'Últimos FPS de reproducción / límite'}</dt><dd data-testid="process-diagnostic-fps">{show(measurement?.renderedFps)} / {show(sample?.targetFps)} FPS</dd></div>
        <div><dt>Render CPU medio / máximo</dt><dd>{show(measurement?.renderCpuMeanMs, ' ms')} / {show(measurement?.renderCpuMaxMs, ' ms')}</dd></div>
        <div><dt>Resolución / escala de píxeles</dt><dd>{show(sample?.renderResolution)} / {show(sample?.pixelRatio)}</dd></div>
        <div><dt>Carga y preparación de modelos</dt><dd>{show(sample?.modelsLoadMs, ' ms')}{sample?.modelBytes != null && ` · ${(sample.modelBytes / 1048576).toFixed(2)} MiB`}</dd></div>
        <div><dt>Inicio completo del visor</dt><dd>{show(sample?.readyMs, ' ms')}</dd></div>
        <div><dt>Último render: llamadas / triángulos</dt><dd>{show(sample?.drawCalls)} / {show(sample?.triangles)}</dd></div>
      </dl>
      <p>En pausa no hay FPS continuos: es normal. Conservamos la última muestra, sin contar el tiempo detenido. «—» significa que falta una muestra de un segundo de reproducción. Cambiar de escena, reiniciar o cambiar de calidad limpia la medición.</p>
      <p>El tiempo CPU no mide la GPU ni toda la aplicación. Los límites son 20 FPS en Ligero y 30 en Completo; no buscamos 60. El tamaño de los archivos no es RAM utilizada.</p>
      {(error || sample?.error) && <p className="ar-diagnostics-error">Último error: {error || sample.error}</p>}
      <label htmlFor="process-diagnostic-device">Teléfono probado (opcional)</label>
      <input id="process-diagnostic-device" maxLength={100} value={device} onChange={event => setDevice(event.target.value)} placeholder="Ej.: Samsung Galaxy A04" />
      <button type="button" onClick={copyReport}>Copiar informe del prototipo</button>
      <p>Solo se copia cuando lo solicitas. Incluye navegador, pantalla y conexión estimada si está disponible. No envía datos, no usa cámara y no guarda el teléfono entre visitas.</p>
      <p role="status">{message}</p>
      {report && <label>Informe capturado del prototipo (copia fija)
        <textarea readOnly rows={7} value={report} onFocus={event => event.target.select()} />
      </label>}
    </div>}
  </details>
}

export default memo(ProcessDiagnostics)
