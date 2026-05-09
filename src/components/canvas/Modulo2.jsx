import React from 'react'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

export default function Modulo2() {
return (
    <ModuloBase
    num="2"
    color="#22c55e"
    pageStyle={{
      '--mod-page-bg': '#f0fdf4',
      '--mod-page-text': '#0f172a',
      '--mod-header-start': 'rgba(34,197,94,0.10)',
      '--mod-info-bg': 'rgba(255,255,255,0.88)',
      '--mod-info-border': 'rgba(34,197,94,0.12)',
      '--mod-btn-text': '#0f172a',
      '--mod-surface': 'rgba(255,255,255,0.72)',
    }}
    icon="🔬"
    titulo="Visualización de la reacción de saponificación"
    subtitulo="Observa las etapas del proceso: desde la mezcla de aceite usado con NaOH hasta la formación del jabón ecológico."
    objetivo="Describir las etapas del proceso de saponificación utilizadas en la elaboración de jabón a partir de aceite de cocina usado."
    contenido={
        <ol style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong style={{ color: '#0f172a' }}>Etapa 1:</strong> Medir aceite de cocina usado</li>
        <li><strong style={{ color: '#0f172a' }}>Etapa 2:</strong> Preparar solución de NaOH</li>
        <li><strong style={{ color: '#0f172a' }}>Etapa 3:</strong> Mezcla y agitación controlada</li>
        <li><strong style={{ color: '#0f172a' }}>Etapa 4:</strong> Control de temperatura</li>
        <li><strong style={{ color: '#0f172a' }}>Etapa 5:</strong> Moldeo y reposo del jabón</li>
        </ol>
    }
    instruccion='Usa los botones "Siguiente paso" y "Anterior" para avanzar entre las etapas del proceso. Cada etapa muestra la transformación en tiempo real.'
    prevPath="/modulo/1"
    nextPath="/modulo/3"
    />
)
}