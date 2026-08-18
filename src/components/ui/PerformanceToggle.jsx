import React from 'react'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import { setPerformancePreference } from '../../utils/performanceProfile'

const labels = {
  auto: 'Auto',
  reduced: 'Ligera',
  full: 'Completa',
}

export default function PerformanceToggle() {
  const { preference, profile } = usePerformanceProfile()

  return (
    <label className="performance-control" title={`Perfil activo: ${profile === 'reduced' ? 'ligero' : 'completo'}`}>
      <span aria-hidden="true">⚙</span>
      <span className="performance-label">Calidad</span>
      <select
        value={preference}
        onChange={(event) => setPerformancePreference(event.target.value)}
        aria-label="Calidad visual"
      >
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  )
}
