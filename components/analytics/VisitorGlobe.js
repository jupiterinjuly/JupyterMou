import { useGlobal } from '@/lib/global'
import { geoDistance, geoOrthographic, geoPath } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import world from 'world-atlas/land-110m.json'

const land = feature(world, world.objects.land)

export default function VisitorGlobe({ countries = [], size = 260, compact }) {
  const canvasRef = useRef(null)
  const pointsRef = useRef([])
  const hoveringRef = useRef(false)
  const { isDarkMode } = useGlobal()
  const [hovered, setHovered] = useState(null)
  const [unavailable, setUnavailable] = useState(false)
  const markers = useMemo(
    () =>
      countries.filter(
        country =>
          Number.isFinite(country.latitude) &&
          Number.isFinite(country.longitude) &&
          country.users > 0
      ),
    [countries]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) {
      setUnavailable(true)
      return
    }

    let frame
    let angle = 105
    let previous = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size * ratio)
    canvas.height = Math.round(size * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const radius = size * 0.445
    const center = size / 2
    const projection = geoOrthographic()
      .translate([center, center])
      .scale(radius)
      .clipAngle(90)
    const path = geoPath(projection, context)

    const draw = timestamp => {
      if (timestamp - previous < 33) {
        frame = window.requestAnimationFrame(draw)
        return
      }
      previous = timestamp
      if (!reducedMotion && !hoveringRef.current) angle = (angle + 0.23) % 360
      projection.rotate([-angle, -18])
      context.clearRect(0, 0, size, size)

      const ocean = context.createRadialGradient(
        center - radius * 0.35, center - radius * 0.4, radius * 0.07,
        center, center, radius * 1.15
      )
      ocean.addColorStop(0, isDarkMode ? '#63b9e3' : '#79cdeb')
      ocean.addColorStop(0.7, isDarkMode ? '#247cb5' : '#349bcf')
      ocean.addColorStop(1, isDarkMode ? '#164c86' : '#2266ad')
      context.beginPath()
      context.arc(center, center, radius, 0, Math.PI * 2)
      context.fillStyle = ocean
      context.fill()

      context.beginPath()
      path(land)
      context.fillStyle = isDarkMode ? '#75bd78' : '#80c878'
      context.fill()
      context.lineWidth = compact ? 0.65 : 0.85
      context.strokeStyle = isDarkMode ? '#a7dc9b' : '#b6dfa1'
      context.stroke()

      const maxUsers = Math.max(1, ...markers.map(marker => marker.users))
      const points = []
      markers.forEach(marker => {
        const location = [marker.longitude, marker.latitude]
        if (geoDistance([angle, 18], location) > Math.PI / 2 - 0.025) return
        const [x, y] = projection(location)
        const dot = Math.min(compact ? 4.3 : 6, 2.2 + Math.sqrt(marker.users / maxUsers) * (compact ? 2.1 : 3.8))
        context.beginPath()
        context.arc(x, y, dot + 2.2, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255,255,255,0.83)'
        context.fill()
        context.beginPath()
        context.arc(x, y, dot, 0, Math.PI * 2)
        context.fillStyle = '#886af0'
        context.fill()
        points.push({ x, y, marker })
      })
      pointsRef.current = points

      context.beginPath()
      context.arc(center, center, radius, 0, Math.PI * 2)
      context.lineWidth = 1.5
      context.strokeStyle = isDarkMode ? '#83bbf6' : '#b8ddf3'
      context.stroke()
      if (!reducedMotion) frame = window.requestAnimationFrame(draw)
    }
    frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [compact, isDarkMode, markers, size])

  const onPointerMove = event => {
    if (compact) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) * (size / bounds.width)
    const y = (event.clientY - bounds.top) * (size / bounds.height)
    const nearest = pointsRef.current.find(point => Math.hypot(point.x - x, point.y - y) < 12)
    hoveringRef.current = Boolean(nearest)
    setHovered(nearest || null)
  }

  if (unavailable) {
    return <div className='min-h-32 flex items-center justify-center text-sm text-gray-500'>全球足迹暂不可用</div>
  }

  return (
    <div
      className={`relative mx-auto max-w-full ${compact ? 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105' : ''}`}
      aria-label='访客国家分布地球图'
      style={{ width: size, height: size }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        hoveringRef.current = false
        setHovered(null)
      }}
    >
      <canvas ref={canvasRef} className='block mx-auto max-w-full h-auto' style={{ width: size, height: size }} />
      {hovered && (
        <div
          role='status'
          className='pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow-lg'
          style={{ left: Math.min(size - 12, Math.max(12, hovered.x)), top: Math.max(12, hovered.y - 12), transform: 'translate(-50%, -100%)' }}
        >
          {hovered.marker.name} · {hovered.marker.users} 位用户
        </div>
      )}
    </div>
  )
}
