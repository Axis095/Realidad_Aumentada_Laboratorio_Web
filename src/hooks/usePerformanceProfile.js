import { useEffect, useState } from 'react'
import { applyPerformanceProfile, getPerformancePreference } from '../utils/performanceProfile'

export default function usePerformanceProfile() {
  const [state, setState] = useState(() => ({
    preference: getPerformancePreference(),
    profile: applyPerformanceProfile(),
  }))

  useEffect(() => {
    const update = (event) => {
      setState({
        preference: event.detail?.preference ?? getPerformancePreference(),
        profile: event.detail?.profile ?? applyPerformanceProfile(),
      })
    }
    window.addEventListener('labvirtual-performance-change', update)
    return () => window.removeEventListener('labvirtual-performance-change', update)
  }, [])

  return state
}
