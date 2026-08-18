export const PERFORMANCE_PREFERENCE_KEY = 'labvirtual-visual-quality'

export function getPerformancePreference() {
  try {
    return localStorage.getItem(PERFORMANCE_PREFERENCE_KEY) || 'auto'
  } catch (error) {
    return 'auto'
  }
}

export function resolvePerformanceProfile(preference = getPerformancePreference()) {
  if (preference === 'reduced') return 'reduced'
  if (preference === 'full') return 'full'

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const saveData = navigator.connection?.saveData
  const slowConnection = ['slow-2g', '2g', '3g'].includes(navigator.connection?.effectiveType)
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4
  const fewCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4

  return reducedMotion || saveData || slowConnection || lowMemory || fewCores ? 'reduced' : 'full'
}

export function applyPerformanceProfile(preference = getPerformancePreference()) {
  const profile = resolvePerformanceProfile(preference)
  document.documentElement.classList.toggle('performance-reduced', profile === 'reduced')
  document.documentElement.dataset.performance = profile
  return profile
}

export function setPerformancePreference(preference) {
  try { localStorage.setItem(PERFORMANCE_PREFERENCE_KEY, preference) } catch (error) {}
  const profile = applyPerformanceProfile(preference)
  window.dispatchEvent(new CustomEvent('labvirtual-performance-change', { detail: { preference, profile } }))
  return profile
}
