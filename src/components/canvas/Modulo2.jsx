import React from 'react'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

export default function Modulo2() {
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
    titulo="Visualización de la reacción de saponificación"
    subtitulo="Observa las etapas del proceso: desde la mezcla de aceite usado con NaOH hasta la formación del jabón ecológico."
    objetivo="Describir las etapas del proceso de saponificación utilizadas en la elaboración de jabón a partir de aceite de cocina usado."
    contenido={
        <ol style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Etapa 1:</strong> Medir aceite de cocina usado</li>
        <li><strong>Etapa 2:</strong> Preparar solución de NaOH</li>
        <li><strong>Etapa 3:</strong> Mezcla y agitación controlada</li>
        <li><strong>Etapa 4:</strong> Control de temperatura</li>
        <li><strong>Etapa 5:</strong> Moldeo y reposo del jabón</li>
        </ol>
    }
    instruccion='Usa los botones "Siguiente paso" y "Anterior" para avanzar entre las etapas del proceso. Cada etapa muestra la transformación en tiempo real.'
    prevPath="/modulo/1"
    nextPath="/modulo/3"
    />
)
}
