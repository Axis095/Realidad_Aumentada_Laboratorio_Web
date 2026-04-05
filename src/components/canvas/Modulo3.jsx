import React from 'react'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

export default function Modulo3() {
return (
    <ModuloBase
    num="3"
    color="#ff6b35"
    icon="⚛"
    titulo="Visualización molecular de la saponificación"
    subtitulo="Explora la reacción a nivel molecular con realidad aumentada. Identifica triglicéridos, NaOH, glicerol y jabón."
    objetivo="Explicar la reacción de saponificación a nivel molecular identificando las moléculas participantes e interpretar la ecuación química que representa el proceso."
    contenido={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.8rem', color: '#ff6b35', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            ECUACIÓN QUÍMICA
        </div>
        <div style={{ fontFamily: 'monospace', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', lineHeight: '1.8', color: '#e8eaf0' }}>
            Triglicérido + 3 NaOH →<br />
            Glicerol + 3 Jabón (RCOONa)
        </div>
        <p style={{ fontSize: '0.8rem', color: '#7b8399', lineHeight: '1.6', marginTop: '4px' }}>
            Moléculas: Triglicéridos · Hidróxido de sodio · Glicerol · Ácidos grasos
        </p>
        </div>
    }
    instruccion="Activa la cámara para usar Realidad Aumentada. Apunta el teléfono al marcador impreso para ver las moléculas en tu espacio físico."
    prevPath="/modulo/2"
    nextPath={null}
    />
)
}