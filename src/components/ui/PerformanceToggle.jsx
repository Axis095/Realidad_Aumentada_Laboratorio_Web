import React from 'react'
import usePerformanceProfile from '../../hooks/usePerformanceProfile'
import { setPerformancePreference } from '../../utils/performanceProfile'

const labels = {
  auto: 'Auto',
  reduced: 'Ligera',
  full: 'Completa',
}

const shortLabels = {
  auto: 'A',
  reduced: 'L',
  full: 'C',
}

function QualityOptions() {
  return Object.entries(labels).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ))
}

export default function PerformanceToggle({ compact = false }) {
  const { preference, profile } = usePerformanceProfile()

  const handleChange = (event) => {
    setPerformancePreference(event.target.value)
  }

  const activeProfile = profile === 'reduced' ? 'ligero' : 'completo'
  const accessibleLabel = `Calidad visual. Seleccionada: ${labels[preference]}`

  if (compact) {
    return (
      <label
        className="performance-control-mobile"
        title={`Calidad ${labels[preference]}. Perfil activo: ${activeProfile}`}
      >
        <svg className="performance-mobile-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
        </svg>
        <span className="performance-mobile-mode" aria-hidden="true">{shortLabels[preference]}</span>
        <select value={preference} onChange={handleChange} aria-label={accessibleLabel}>
          <QualityOptions />
        </select>
      </label>
    )
  }

  return (
    <label className="performance-control performance-control-desktop" title={`Perfil activo: ${activeProfile}`}>
      <span aria-hidden="true">⚙</span>
      <span className="performance-label">Calidad</span>
      <select value={preference} onChange={handleChange} aria-label={accessibleLabel}>
        <QualityOptions />
      </select>
    </label>
  )
}
