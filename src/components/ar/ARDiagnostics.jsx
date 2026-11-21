import React, { useEffect, useRef, useState } from 'react'
import './ARDiagnostics.css'

const show = (value, unit = '') => value === null || value === undefined ? '—' : `${value}${unit}`

export default function ARDiagnostics({ instrument, profile, status, error, diagnosticsRef, enabledRef }) {
  const [open, setOpen] = useState(false)
  const [sample, setSample] = useState(null)
  const [device, setDevice] = useState('')
  const [report, setReport] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
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
      diagnosticVersion: 1,
      capturedAt: new Date().toISOString(),
      instrument: { id: instrument.id, title: instrument.title, marker: instrument.markerCode },
      device: device.trim() || 'No indicado',
      browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: window.devicePixelRatio },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType ?? null,
        saveData: navigator.connection.saveData ?? null,
      } : null,
      selectedProfile: profile,
      status,
      error: error || snapshot?.error || null,
      runtime: snapshot,
      notes: 'FPS = ciclos de seguimiento, no FPS de cámara. Procesamiento = CPU, no tiempo GPU. Carga GLB = descarga + preparación; inicio incluye permiso. Recursos = último render. Sin medición de temperatura ni RAM total.',
    }, null, 2)
    setReport(text)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      if (mounted.current) setCopyStatus('Informe copiado. Puedes pegarlo en el chat.')
    } catch {
      if (mounted.current) setCopyStatus('No se pudo copiar automáticamente. Selecciona y copia el texto de abajo.')
    }
  }

  const tracking = sample?.tracking
  return (
    <details className="ar-diagnostics" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>Diagnóstico de rendimiento <span>Opcional</span></summary>
      {open && <div className="ar-diagnostics-body">
        <p>Medición local cada segundo, solo con este panel abierto. No envía datos ni imágenes.</p>
        <dl>
          <div><dt>Perfil de esta sesión</dt><dd>{sample ? (sample.profile === 'reduced' ? 'Ligero' : 'Completo') : 'Sin iniciar'}</dd></div>
          <div><dt>Estado</dt><dd>{sample?.running ? (status === 'found' ? 'Listo / detectado' : status === 'loading' ? 'Preparando' : 'Buscando tarjeta') : sample ? 'Detenido · última muestra' : 'Sin iniciar'}</dd></div>
          <div><dt>Seguimiento real / límite</dt><dd data-testid="diagnostic-fps">{sample?.mode === 'preview' ? 'Bajo demanda · sin FPS continuo' : `${show(tracking?.trackingFps)} / ${show(sample?.targetTrackingFps)} FPS`}</dd></div>
          <div><dt>Procesamiento CPU medio / máximo</dt><dd>{show(tracking?.processingMeanMs, ' ms')} / {show(tracking?.processingMaxMs, ' ms')}</dd></div>
          <div><dt>Cuadros con tarjeta detectada</dt><dd>{show(tracking?.detectedPercent, ' %')}</dd></div>
          <div><dt>Cámara / análisis</dt><dd>{show(sample?.cameraResolution)} / {show(sample?.trackingResolution)}</dd></div>
          <div><dt>Resolución de render</dt><dd>{show(sample?.renderResolution)}</dd></div>
          <div><dt>Carga y preparación del GLB</dt><dd>{show(sample?.modelLoadMs, ' ms')}{sample?.modelBytes != null && ` · ${(sample.modelBytes / 1048576).toFixed(2)} MiB`}</dd></div>
          <div><dt>Inicio, incluido permiso de cámara</dt><dd>{show(sample?.readyMs, ' ms')}</dd></div>
          <div><dt>Último render: llamadas / triángulos</dt><dd>{show(sample?.drawCalls)} / {show(sample?.triangles)}</dd></div>
        </dl>
        <p>El límite es 15 FPS en Ligero y 24 en Completo; no buscamos 60. La detección baja al retirar la tarjeta. Los tiempos de CPU no miden la GPU, y el tamaño del GLB no es RAM utilizada. «—» indica que aún no hay una medición.</p>
        {(error || sample?.error) && <p className="ar-diagnostics-error">Último error: {error || sample.error}</p>}
        <label htmlFor="ar-diagnostic-device">Teléfono probado (opcional)</label>
        <input id="ar-diagnostic-device" value={device} maxLength={100} onChange={event => setDevice(event.target.value)} placeholder="Ej.: Samsung Galaxy A04" />
        <button type="button" onClick={copyReport}>Copiar informe de diagnóstico</button>
        <p>El informe incluye navegador, pantalla y conexión estimada cuando esté disponible. No guarda datos entre visitas ni se envía automáticamente.</p>
        <p role="status">{copyStatus}</p>
        {report && <label>Informe capturado (no se actualiza al copiarlo)
          <textarea readOnly rows={7} value={report} onFocus={event => event.target.select()} />
        </label>}
      </div>}
    </details>
  )
}
