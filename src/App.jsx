import React, { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/ui/Navbar'
import Bienvenida from './components/ui/Bienvenida'
import RouteLoader from './components/ui/RouteLoader'

const Modulo1 = lazy(() => import('./components/canvas/Modulo1'))
const Modulo2 = lazy(() => import('./components/canvas/Modulo2'))
const Modulo3 = lazy(() => import('./components/canvas/Modulo3'))
const ARExperience = lazy(() => import('./components/ar/ARExperience'))
const ARPrintCard = lazy(() => import('./components/ar/ARPrintCard'))

export default function App() {
  const { pathname } = useLocation()
  const isAR = pathname === '/ar/beaker' || pathname === '/ar/tarjeta'
  return (
    <div className="app-shell">
      {!isAR && <Navbar />}
      <main className="app-main" style={isAR ? { paddingBottom: 0 } : undefined}>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Bienvenida />} />
            <Route path="/modulo/1" element={<Modulo1 />} />
            <Route path="/modulo/2" element={<Modulo2 />} />
            <Route path="/modulo/3" element={<Modulo3 />} />
            <Route path="/ar/beaker" element={<ARExperience />} />
            <Route path="/ar/tarjeta" element={<ARPrintCard />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
