import React from 'react'
import ModuloBase from './ModuloBase'
import './ModuloBase.css'

export default function Modulo1() {
return (
    <ModuloBase
    num="1"
    color="#4f8eff"
    icon="🧪"
    titulo="Reconocimiento de material de laboratorio"
    subtitulo="Identifica los instrumentos necesarios para realizar la reacción de saponificación."
    objetivo="Identificar el material de laboratorio necesario para realizar la reacción de saponificación utilizada en la elaboración de jabones ecológicos."
    contenido={
        <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <li>Vaso de precipitados</li>
        <li>Probeta graduada</li>
        <li>Balanza analítica</li>
        <li>Termómetro</li>
        <li>Varilla de agitación</li>
        <li>Moldes para jabón</li>
        </ul>
    }
    instruccion="Rota el modelo 3D con el mouse o toca la pantalla. Haz clic en cada instrumento para ver su información y función en el proceso."
    prevPath={null}
    nextPath="/modulo/2"
    />
)
}