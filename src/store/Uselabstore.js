import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useLabStore = create(
  persist(
    (set) => ({
      moduloActual: 1,
      ultimaRuta: '/modulo/1',
      setModulo: (num) => set({ moduloActual: num, ultimaRuta: `/modulo/${num}` }),
      setUltimaRuta: (ruta) => set({ ultimaRuta: ruta }),

      pasoActual: 0,
      totalPasos: 5,
      pasosModulo2Explorados: [],
      visitarPasoModulo2: (paso) =>
        set((state) => ({
          pasoActual: paso,
          pasosModulo2Explorados: state.pasosModulo2Explorados.includes(paso)
            ? state.pasosModulo2Explorados
            : [...state.pasosModulo2Explorados, paso],
        })),
      siguientePaso: () =>
        set((state) => ({ pasoActual: Math.min(state.pasoActual + 1, state.totalPasos - 1) })),
      anteriorPaso: () =>
        set((state) => ({ pasoActual: Math.max(state.pasoActual - 1, 0) })),
      resetPasos: () => set({ pasoActual: 0 }),

      instrumentoSeleccionado: 'beaker',
      instrumentosExplorados: [],
      setInstrumento: (id) =>
        set((state) => ({
          instrumentoSeleccionado: id,
          instrumentosExplorados: state.instrumentosExplorados.includes(id)
            ? state.instrumentosExplorados
            : [...state.instrumentosExplorados, id],
        })),

      arActivo: false,
      toggleAR: () => set((state) => ({ arActivo: !state.arActivo })),

      moleculaSeleccionada: 'triglicerido',
      moleculasExploradas: [],
      setMolecula: (id) =>
        set((state) => ({
          moleculaSeleccionada: id,
          moleculasExploradas: state.moleculasExploradas.includes(id)
            ? state.moleculasExploradas
            : [...state.moleculasExploradas, id],
        })),

      modulosCompletados: [],
      completarModulo: (num) =>
        set((state) => ({
          modulosCompletados: state.modulosCompletados.includes(num)
            ? state.modulosCompletados
            : [...state.modulosCompletados, num],
        })),

      mejorPuntuacionQuiz: null,
      guardarPuntuacionQuiz: (score) =>
        set((state) => ({
          mejorPuntuacionQuiz: state.mejorPuntuacionQuiz === null
            ? score
            : Math.max(state.mejorPuntuacionQuiz, score),
        })),

      reiniciarProgreso: () => set({
        moduloActual: 1,
        ultimaRuta: '/modulo/1',
        pasoActual: 0,
        pasosModulo2Explorados: [],
        instrumentoSeleccionado: 'beaker',
        instrumentosExplorados: [],
        arActivo: false,
        moleculaSeleccionada: 'triglicerido',
        moleculasExploradas: [],
        modulosCompletados: [],
        mejorPuntuacionQuiz: null,
      }),
    }),
    {
      name: 'labvirtual-progress',
      version: 2,
      migrate: (persistedState) => ({
        ...(persistedState ?? {}),
        pasosModulo2Explorados: persistedState?.pasosModulo2Explorados ?? [],
        moleculaSeleccionada: persistedState?.moleculaSeleccionada ?? 'triglicerido',
        moleculasExploradas: persistedState?.moleculasExploradas ?? [],
      }),
      partialize: (state) => ({
        moduloActual: state.moduloActual,
        ultimaRuta: state.ultimaRuta,
        pasoActual: state.pasoActual,
        pasosModulo2Explorados: state.pasosModulo2Explorados,
        instrumentoSeleccionado: state.instrumentoSeleccionado,
        instrumentosExplorados: state.instrumentosExplorados,
        moleculaSeleccionada: state.moleculaSeleccionada,
        moleculasExploradas: state.moleculasExploradas,
        modulosCompletados: state.modulosCompletados,
        mejorPuntuacionQuiz: state.mejorPuntuacionQuiz,
      }),
    },
  ),
)

export default useLabStore
