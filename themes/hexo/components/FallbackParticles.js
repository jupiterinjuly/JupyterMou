import { useEffect, useRef } from 'react'

const COLORS = ['91, 117, 219', '132, 119, 218', '237, 166, 112']

/**
 * A lightweight canvas constellation used only on fallback pages.
 * It follows the pointer gently and becomes static when reduced motion is set.
 */
export default function FallbackParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext?.('2d')
    if (
      !canvas ||
      !context ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      return
    }

    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches
    const pointer = { x: -1000, y: -1000 }
    let particles = []
    let frameId

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(bounds.width * ratio))
      canvas.height = Math.max(1, Math.floor(bounds.height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)

      const count = bounds.width < 768 ? 18 : 42
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        radius: index % 9 === 0 ? 2.4 : 1 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        color: COLORS[index % COLORS.length]
      }))
    }

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      context.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]
        if (!reduceMotion) {
          const dx = pointer.x - particle.x
          const dy = pointer.y - particle.y
          const pointerDistance = Math.hypot(dx, dy)
          if (pointerDistance < 150 && pointerDistance > 1) {
            particle.vx += (dx / pointerDistance) * 0.0025
            particle.vy += (dy / pointerDistance) * 0.0025
          }
          particle.vx *= 0.995
          particle.vy *= 0.995
          particle.x += particle.vx
          particle.y += particle.vy

          if (particle.x < -10) particle.x = width + 10
          if (particle.x > width + 10) particle.x = -10
          if (particle.y < -10) particle.y = height + 10
          if (particle.y > height + 10) particle.y = -10
        }

        context.beginPath()
        context.fillStyle = `rgba(${particle.color}, .55)`
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const neighbor = particles[j]
          const distance = Math.hypot(
            particle.x - neighbor.x,
            particle.y - neighbor.y
          )
          if (distance < 118) {
            context.beginPath()
            context.strokeStyle = `rgba(${particle.color}, ${
              (1 - distance / 118) * 0.16
            })`
            context.lineWidth = 0.7
            context.moveTo(particle.x, particle.y)
            context.lineTo(neighbor.x, neighbor.y)
            context.stroke()
          }
        }
      }

      if (!reduceMotion) {
        frameId = window.requestAnimationFrame(draw)
      }
    }

    const handlePointerMove = event => {
      const bounds = canvas.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
    }
    const handlePointerLeave = () => {
      pointer.x = -1000
      pointer.y = -1000
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    canvas.parentElement?.addEventListener('pointermove', handlePointerMove)
    canvas.parentElement?.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.cancelAnimationFrame?.(frameId)
      window.removeEventListener('resize', resize)
      canvas.parentElement?.removeEventListener(
        'pointermove',
        handlePointerMove
      )
      canvas.parentElement?.removeEventListener(
        'pointerleave',
        handlePointerLeave
      )
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className='absolute inset-0 h-full w-full pointer-events-none'
    />
  )
}
