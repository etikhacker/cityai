'use client'

import type { MouseEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'

type Ripple = { id: number; x: number; y: number }

type LiquidMetalButtonProps = {
  label: ReactNode
  trailing?: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function LiquidMetalButton({ label, trailing, onClick, disabled = false, className = '' }: LiquidMetalButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleId = useRef(0)

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const ripple = { id: rippleId.current++, x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    setRipples((current) => [...current, ripple])
    window.setTimeout(() => setRipples((current) => current.filter((item) => item.id !== ripple.id)), 560)
    onClick()
  }

  return (
    <button type="button" onClick={handleClick} disabled={disabled} className={`liquid-metal-button ${className}`}>
      <span className="liquid-metal-surface" aria-hidden="true" />
      {ripples.map((ripple) => (
        <span key={ripple.id} className="liquid-metal-ripple" style={{ left: ripple.x, top: ripple.y }} aria-hidden="true" />
      ))}
      <span className="liquid-metal-label">
        {label}
        {trailing ? <span className="liquid-metal-trailing" aria-hidden="true">{trailing}</span> : null}
      </span>
    </button>
  )
}
