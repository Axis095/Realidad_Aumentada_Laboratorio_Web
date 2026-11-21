// Deterministic poses let students pause, scrub and repeat without accumulating drift.
export const PROCESS_SCENES = [
  { id: 'fill', title: 'Llenado', duration: 6, description: 'Observa cómo aumenta el nivel del aceite en el vaso. El llenado representa una cantidad ilustrativa, no una medición.', observation: 'El aceite es uno de los reactivos del proceso.' },
  { id: 'pour', title: 'Vertido', duration: 8, description: 'La solución alcalina ya preparada se incorpora al aceite. Esta escena no representa la preparación del NaOH ni establece cantidades para una práctica real.', observation: 'El recipiente azul contiene solución alcalina preparada; el amarillo contiene aceite.' },
  { id: 'stir', title: 'Agitación', duration: 7, description: 'El agitador recorre la mezcla y su apariencia cambia gradualmente. El movimiento favorece el contacto entre los reactivos.', observation: 'El cambio de aspecto es esquemático: no demuestra que la reacción o el curado hayan terminado.' },
]

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
