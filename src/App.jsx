import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/ui/Navbar'
import Bienvenida from './components/ui/Bienvenida'
import Modulo1 from './components/canvas/Modulo1'
import Modulo2 from './components/canvas/Modulo2'
import Modulo3 from './components/canvas/Modulo3'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Bienvenida />} />
          <Route path="/modulo/1" element={<Modulo1 />} />
          <Route path="/modulo/2" element={<Modulo2 />} />
          <Route path="/modulo/3" element={<Modulo3 />} />
        </Routes>
      </main>
    </div>
  )
}