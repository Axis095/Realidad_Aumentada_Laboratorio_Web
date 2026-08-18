import React from 'react'
import { NavLink } from 'react-router-dom'
import useLabStore from '../../store/Uselabstore'
import PerformanceToggle from './PerformanceToggle'
import './Navbar.css'

const modulos = [
{ path: '/modulo/1', label: 'Material de Lab', num: '01', color: '#3974d8' },
{ path: '/modulo/2', label: 'Saponificación', num: '02', color: '#218c68' },
{ path: '/modulo/3', label: 'Nivel Molecular', num: '03', color: '#e96f32' },
]

export default function Navbar() {
const modulosCompletados = useLabStore((state) => state.modulosCompletados)

return (
    <>
    <nav className="navbar">
    <NavLink to="/" className="navbar-brand">
        <span className="brand-icon">⚗</span>
        <span className="brand-text">
        <span className="brand-main">LabVirtual</span>
        <span className="brand-sub">Saponificación</span>
        </span>
    </NavLink>

    <div className="navbar-modules">
        {modulos.map((m) => (
        <NavLink
            key={m.path}
            to={m.path}
            className={({ isActive }) =>
            `nav-module-btn ${isActive ? 'active' : ''}`
            }
            style={{ '--mod-color': m.color }}
        >
            <span className="mod-num">{m.num}</span>
            <span className="mod-label">{m.label}</span>
            {modulosCompletados.includes(Number(m.num)) && <span className="nav-complete" aria-label="Módulo completado">✓</span>}
        </NavLink>
        ))}
    </div>

    <div className="navbar-actions">
        <span className="navbar-course">Química · Experiencia interactiva</span>
        <PerformanceToggle />
    </div>
    </nav>

    <div className="mobile-performance-fab">
        <PerformanceToggle compact />
    </div>
    </>
)
}
