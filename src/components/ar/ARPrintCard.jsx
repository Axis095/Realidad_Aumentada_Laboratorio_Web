import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { getARInstrument, instrumentPath } from '../../data/instruments'
import InstrumentSelector from './InstrumentSelector'
import { UnknownInstrument } from './ARCatalog'
import './ARPrintCard.css'

function getPublicDestination(value, instrumentId) {
  try {
    const address = new URL(value.trim())
    const hostname = address.hostname.toLowerCase().replace(/\.$/, '')
    const hasPublicName = hostname.includes('.')
      && !/^[\d.]+$/.test(hostname)
      && !hostname.includes(':')
      && !/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(hostname)
      && !/(^|\.)example\.(com|org|net)$/.test(hostname)

    if (address.protocol !== 'https:' || address.username || address.password || !hasPublicName) {
      return null
    }

    // The QR always opens the stable instrument route, even if a full page URL was pasted.
    return `${address.origin}${instrumentPath(instrumentId)}`
  } catch {
    return null
  }
}

export default function ARPrintCard() {
  const [params, setParams] = useSearchParams()
  const [publicAddress, setPublicAddress] = useState(() => window.location.origin)
  const instrument = getARInstrument(params.get('instrumento') || 'beaker')
  if (!instrument) return <UnknownInstrument />
  return <PrintInstrumentCard key={instrument.id} instrument={instrument} publicAddress={publicAddress}
    setPublicAddress={setPublicAddress} onSelect={id => setParams({ instrumento: id })} />
}

function PrintInstrumentCard({ instrument, publicAddress, setPublicAddress, onSelect }) {
  const [qrCode, setQrCode] = useState(null)
  const [qrLoadedFor, setQrLoadedFor] = useState(null)
  const [qrError, setQrError] = useState(false)
  const [markerLoaded, setMarkerLoaded] = useState(false)
  const [markerError, setMarkerError] = useState(false)
  const destination = getPublicDestination(publicAddress, instrument.id)

  useEffect(() => {
    let cancelled = false
    setQrError(false)
    setQrCode(null)
    setQrLoadedFor(null)
    if (!destination) return undefined

    QRCode.toString(destination, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 224,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((svg) => {
      if (!cancelled) {
        setQrCode({ destination, image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
      }
    }).catch(() => {
      if (!cancelled) setQrError(true)
    })

    return () => { cancelled = true }
  }, [destination])

  const currentQr = qrCode?.destination === destination ? qrCode : null
  const canPrint = Boolean(destination && currentQr && qrLoadedFor === destination && markerLoaded && !markerError && !qrError)

  return (
    <div className={`ar-print-page${canPrint ? ' ar-print-ready' : ''}`}>
      <div className="ar-print-tools">
        <Link className="ar-print-back" to={`/ar/${instrument.id}`}>← Volver a la experiencia</Link>
        <div className="ar-print-heading">
          <div>
            <p className="ar-print-eyebrow">Para tu próximo evento</p>
            <h1>Una tarjeta, un pequeño laboratorio</h1>
            <p>Prepara el acceso y el marcador que tus estudiantes usarán con su celular.</p>
          </div>
          <button className="ar-print-button" type="button" disabled={!canPrint} onClick={() => { if (canPrint) window.print() }}>
            Imprimir tarjeta
          </button>
        </div>

        <div className="ar-print-config">
          <InstrumentSelector id="ar-print-instrument" value={instrument.id} onChange={onSelect} />
          <label htmlFor="ar-public-address">Dirección pública de la plataforma</label>
          <input
            id="ar-public-address"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={publicAddress}
            onChange={(event) => setPublicAddress(event.target.value)}
            placeholder="https://tu-plataforma.vercel.app"
            aria-invalid={!destination}
            aria-describedby="ar-public-help ar-public-status"
          />
          <p id="ar-public-help">Pega el dominio HTTPS donde publicaste la plataforma. Si incluyes una ruta, usaremos únicamente el dominio.</p>
          <div id="ar-public-status" className={`ar-print-status${destination ? '' : ' ar-print-status-warning'}`} aria-live="polite">
            {destination ? (
              <>
                El QR abrirá: <a href={destination} target="_blank" rel="noopener noreferrer">{destination}</a>
                <span>Comprueba que este enlace ya funciona desde un celular antes de imprimir. El QR se genera en tu navegador.</span>
              </>
            ) : (
              <>
                Puedes previsualizar el marcador, pero para imprimir necesitas una dirección pública HTTPS.
                <span>Un enlace localhost solo funciona en esta computadora; no abriría la experiencia en los celulares de los estudiantes.</span>
              </>
            )}
          </div>
          {(qrError || markerError) && (
            <p className="ar-print-status ar-print-status-warning" role="alert">
              {markerError ? 'No se pudo cargar el marcador. Recarga esta página antes de imprimir.' : 'No se pudo generar o mostrar el QR. Revisa la dirección y vuelve a intentarlo.'}
            </p>
          )}
          {canPrint && <a className="ar-download-qr" href={currentQr.image} download={`qr-${instrument.id}.svg`}>Descargar solo el QR (SVG)</a>}
        </div>
      </div>

      <p className="ar-print-blocked-message">Tarjeta no lista para imprimir. Abre esta página en pantalla, configura una dirección pública HTTPS y espera a que carguen el QR y el marcador.</p>

      <article className="ar-print-card" aria-label={`Tarjeta imprimible: ${instrument.title}`}>
        <header className="ar-print-card-header">
          <div className="ar-print-brand">Lab<span>Virtual</span><span className="ar-print-brand-dots" aria-hidden="true"><i /><i /><i /></span></div>
          <span className="ar-print-demo-badge">Tarjeta {instrument.markerCode}</span>
        </header>
        <div className="ar-print-card-title">
          <p>Descubre el laboratorio en realidad aumentada</p>
          <h2>{instrument.title}</h2>
        </div>

        <section className="ar-print-qr-step" aria-labelledby="ar-print-step-one">
          <div className="ar-print-qr-box">
            {currentQr ? (
              <img
                key={currentQr.destination}
                src={currentQr.image}
                alt="Código QR para abrir la experiencia de realidad aumentada"
                width="224"
                height="224"
                onLoad={() => setQrLoadedFor(currentQr.destination)}
                onError={() => setQrError(true)}
              />
            ) : (
              <span className="ar-print-qr-placeholder">{destination ? 'Preparando QR…' : 'El QR aparecerá al configurar tu dirección pública.'}</span>
            )}
          </div>
          <div>
            <h3 id="ar-print-step-one"><span>01</span> Abre la experiencia</h3>
            <p>Escanea este QR con la cámara de tu celular, abre el enlace y pulsa <strong>Activar cámara</strong>. Acepta el permiso para continuar.</p>
            <p className="ar-print-small">No necesitas instalar una app ni crear una cuenta. Necesitas conexión a Internet.</p>
          </div>
        </section>

        <section className="ar-print-marker-step" aria-labelledby="ar-print-step-two">
          <h3 id="ar-print-step-two"><span>02</span> Apunta al cuadrado negro</h3>
          <p>Encuadra completo el marcador {instrument.markerCode} para ver aparecer {instrument.title.toLowerCase()} sobre esta tarjeta.</p>
          <div className="ar-print-marker">
            <img
              src={instrument.markerImage}
              alt={`Marcador ${instrument.markerCode}: ${instrument.title}`}
              width="512"
              height="512"
              onLoad={() => { setMarkerLoaded(true); setMarkerError(false) }}
              onError={() => { setMarkerLoaded(false); setMarkerError(true) }}
            />
          </div>
          <p className="ar-print-marker-hint">El QR abre el enlace. Este cuadrado mantiene el modelo en su lugar.</p>
        </section>

        <aside className="ar-print-fact">
          <span aria-hidden="true">¿Sabías que…?</span>
          <p>{instrument.description} {instrument.use}</p>
        </aside>
        <footer className="ar-print-card-footer">
          <span>Explora · observa · aprende</span>
          {destination && <span className="ar-print-destination">{destination}</span>}
        </footer>
      </article>

      <aside className="ar-print-tips ar-print-tools">
        <h2>Antes de llevarla al evento</h2>
        <ul>
          <li>Imprime en A4 al 100 %, sin recortar el borde negro ni el espacio blanco del marcador.</li>
          <li>Usa acabado mate si vas a enmicarla. Los reflejos del plástico brillante dificultan que la cámara reconozca el marcador.</li>
          <li>Coloca la tarjeta sobre una superficie plana, con buena luz y sin reflejos directos.</li>
          <li>Prueba el QR impreso y la cámara en un celular. Si el equipo no puede usar AR, la experiencia ofrece una vista alternativa.</li>
        </ul>
      </aside>
    </div>
  )
}
