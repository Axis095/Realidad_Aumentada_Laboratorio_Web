// Deterministic poses let students pause, scrub and repeat without accumulating drift.
export const PROCESS_SCENES = [
  { id: 'fill', title: 'Llenado', duration: 6, description: 'Observa cómo aumenta el nivel del aceite en el vaso. El llenado representa una cantidad ilustrativa, no una medición.', observation: 'El aceite es uno de los reactivos del proceso.' },
  { id: 'pour', title: 'Vertido', duration: 6.792, modelUrl: '/models/optimized/vertido.glb', description: 'La solución alcalina ya preparada se incorpora al aceite. Esta escena no representa la preparación del NaOH ni establece cantidades para una práctica real.', observation: 'El vaso que se inclina contiene la solución alcalina; el recipiente receptor contiene aceite.' },
  { id: 'stir', title: 'Agitación', duration: 7.167, modelUrl: '/models/optimized/agitacion.glb', description: 'El agitador recorre la mezcla. El movimiento favorece el contacto entre los reactivos.', observation: 'El movimiento es ilustrativo: no demuestra que la reacción o el curado hayan terminado.' },
  { id: 'water', title: 'Medición de agua', duration: 9, modelUrl: '/models/optimized/medicion-agua.glb', description: 'La probeta transfiere agua al vaso donde se preparará la solución alcalina.', observation: 'La animación muestra una transferencia ilustrativa. Las cantidades de una práctica las establece el protocolo del docente.' },
  { id: 'dissolve', title: 'Disolución de NaOH', duration: 6.5, modelUrl: '/models/optimized/disolucion.glb', description: 'Se incorpora NaOH al agua y el termómetro representa el aumento de temperatura durante la disolución.', observation: 'Observa el orden de incorporación: NaOH al agua. El termómetro es una representación, no una lectura real.' },
  { id: 'emulsion', title: 'Formación de emulsión', duration: 8, modelUrl: '/models/optimized/emulsion.glb', description: 'La agitación acompaña el cambio de aspecto de la mezcla hacia una emulsión cremosa.', observation: 'El cambio visual ayuda a reconocer la emulsión; esta escena no mide la temperatura ni confirma por sí sola que se alcanzó la traza.' },
  { id: 'mold', title: 'Moldeo', duration: 13.5, modelUrl: '/models/optimized/moldeo.glb', description: 'La mezcla se vierte en las cavidades del molde después de alcanzar la consistencia indicada.', observation: 'La animación termina en el moldeo. El reposo y el curado requieren tiempo real y seguimiento del protocolo; no ocurren en los segundos de esta escena.' },
]

export const PROCESS_STAGES = [
  { title: 'Preparación del aceite', sceneIds: ['fill'], note: 'Observa el llenado del vaso. El filtrado y la medición se explican en la etapa; no se representan en esta animación.' },
  { title: 'Preparación de la solución alcalina', sceneIds: ['water', 'dissolve'], note: 'Primero observa la medición del agua y después la incorporación del NaOH.' },
  { title: 'Mezcla y agitación', sceneIds: ['pour', 'stir'], note: 'Observa el vertido de la solución ya preparada sobre el aceite y la agitación posterior.' },
  { title: 'Observación de la emulsión', sceneIds: ['emulsion'], note: 'Relaciona el cambio de aspecto con la explicación de la temperatura y la traza.' },
  { title: 'Moldeo y curado', sceneIds: ['mold'], note: 'Observa el llenado de los moldes y revisa en la etapa las indicaciones de reposo y curado.' },
]

export const getStageScenes = index => PROCESS_STAGES[index].sceneIds.map(id => PROCESS_SCENES.find(scene => scene.id === id))

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t) }

export function getProcessPose(id, progress) {
  const t = clamp(progress)
  const transfer = ease((t - 0.3) / 0.45)
  const lift = ease(t / 0.25) * (1 - ease((t - 0.8) / 0.2))
  return {
    progress: t,
    receiverLevel: id === 'fill' ? 0.6 * ease(t) : id === 'pour' ? 0.6 + 0.3 * transfer : 0.9,
    donorLevel: 0.7 * (1 - transfer),
    donorLift: lift,
    tilt: Math.PI / 3 * ease((t - 0.2) / 0.1) * (1 - ease((t - 0.75) / 0.15)),
    stream: id === 'pour' && t > 0.3 && t < 0.75,
    stirAngle: t * Math.PI * 8,
    mixed: id === 'stir' ? ease(t) : 0,
  }
}
