import React from 'react'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

export default function Modulo2() {
return (
    <ModuloBase
    num="2"
    color="#00e5c3"
    icon="🔬"
    titulo="Visualización de la reacción de saponificación"
    subtitulo="Observa las etapas del proceso: desde la mezcla de aceite usado con NaOH hasta la formación del jabón ecológico."
    objetivo="Describir las etapas del proceso de saponificación utilizadas en la elaboración de jabón a partir de aceite de cocina usado."
    contenido={
        <ol style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong style={{ color: '#e8eaf0' }}>Etapa 1:</strong> Medir aceite de cocina usado</li>
        <li><strong style={{ color: '#e8eaf0' }}>Etapa 2:</strong> Preparar solución de NaOH</li>
        <li><strong style={{ color: '#e8eaf0' }}>Etapa 3:</strong> Mezcla y agitación controlada</li>
        <li><strong style={{ color: '#e8eaf0' }}>Etapa 4:</strong> Control de temperatura</li>
        <li><strong style={{ color: '#e8eaf0' }}>Etapa 5:</strong> Moldeo y reposo del jabón</li>
        </ol>
    }
    instruccion='Usa los botones "Siguiente paso" y "Anterior" para avanzar entre las etapas del proceso. Cada etapa muestra la transformación en tiempo real.'
    prevPath="/modulo/1"
    nextPath="/modulo/3"
    />
)
}