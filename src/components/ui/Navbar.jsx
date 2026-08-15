import React, { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { animate } from 'animejs'
import useLabStore from '../../store/Uselabstore'
import './Navbar.css'

const modulos = [
{ path: '/modulo/1', label: 'Material de Lab', num: '01', color: '#3974d8' },
{ path: '/modulo/2', label: 'Saponificación', num: '02', color: '#218c68' },
{ path: '/modulo/3', label: 'Nivel Molecular', num: '03', color: '#e96f32' },
]

export default function Navbar() {
const location = useLocation()
const navRef = useRef(null)
const modulosCompletados = useLabStore((state) => state.modulosCompletados)

useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const activeItem = navRef.current?.querySelector('.nav-module-btn.active')
    if (!activeItem) return
    animate(activeItem, {
        scale: [0.97, 1],
        opacity: [0.7, 1],
        duration: 300,
        ease: 'outCubic',
        composition: 'replace',
    })
}, [location.pathname])

return (
    <nav ref={navRef} className="navbar">
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
    </div>
    </nav>
)
}
