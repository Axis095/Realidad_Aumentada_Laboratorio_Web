import { create } from 'zustand'

const useLabStore = create((set) => ({
  // Módulo actual
moduloActual: 1,
setModulo: (num) => set({ moduloActual: num }),

  // Estado del Módulo 2 (pasos de la reacción)
pasoActual: 0,
totalPasos: 5,
siguientePaso: () =>
    set((s) => ({ pasoActual: Math.min(s.pasoActual + 1, s.totalPasos - 1) })),
anteriorPaso: () =>
    set((s) => ({ pasoActual: Math.max(s.pasoActual - 1, 0) })),
resetPasos: () => set({ pasoActual: 0 }),

  // Módulo 1: instrumento seleccionado
instrumentoSeleccionado: null,
setInstrumento: (nombre) => set({ instrumentoSeleccionado: nombre }),

  // Módulo 3: modo AR activo
arActivo: false,
toggleAR: () => set((s) => ({ arActivo: !s.arActivo })),

  // Progreso general del estudiante
modulosCompletados: [],
completarModulo: (num) =>
    set((s) => ({
    modulosCompletados: s.modulosCompletados.includes(num)
        ? s.modulosCompletados
        : [...s.modulosCompletados, num],
    })),
}))

export default useLabStore