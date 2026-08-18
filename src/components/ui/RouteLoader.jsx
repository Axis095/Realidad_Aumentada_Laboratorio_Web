import React, { useEffect, useRef, useState } from 'react'
import './RouteLoader.css'

export default function RouteLoader({ compact = false }) {
  const [visible, setVisible] = useState(false)
  const loaderRef = useRef(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(true), compact ? 120 : 200)
    return () => window.clearTimeout(timeout)
  }, [compact])

  useEffect(() => {
    if (!visible || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let active = true
    let animation

    import('animejs').then(({ animate, stagger }) => {
      if (!active || !loaderRef.current) return
      animation = animate(loaderRef.current.querySelectorAll('.route-loader-dot'), {
        translateY: [0, -7],
        opacity: [0.35, 1],
        alternate: true,
        loop: true,
        delay: stagger(100),
        duration: 480,
        ease: 'inOutSine',
      })
    })

    return () => {
      active = false
      animation?.revert()
    }
  }, [visible])

  if (!visible) return null

  return (
    <div ref={loaderRef} className={`route-loader ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
      <div className="route-loader-mark" aria-hidden="true">⚗</div>
      <strong>Preparando tu laboratorio</strong>
      <span>Organizando la experiencia interactiva…</span>
      <div className="route-loader-dots" aria-hidden="true">
        <i className="route-loader-dot" /><i className="route-loader-dot" /><i className="route-loader-dot" />
      </div>
    </div>
  )
}
