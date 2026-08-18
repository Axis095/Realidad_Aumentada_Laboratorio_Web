import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/ui/Navbar'
import Bienvenida from './components/ui/Bienvenida'
import RouteLoader from './components/ui/RouteLoader'

const Modulo1 = lazy(() => import('./components/canvas/Modulo1'))
const Modulo2 = lazy(() => import('./components/canvas/Modulo2'))
const Modulo3 = lazy(() => import('./components/canvas/Modulo3'))

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Bienvenida />} />
            <Route path="/modulo/1" element={<Modulo1 />} />
            <Route path="/modulo/2" element={<Modulo2 />} />
            <Route path="/modulo/3" element={<Modulo3 />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
