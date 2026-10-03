import { useGlobal } from '@/lib/global'
import { buildGlobeMarkers } from '@/lib/analytics/globe'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function VisitorGlobe({ countries = [], size = 260, compact }) {
  const canvasRef = useRef(null)
  const { isDarkMode } = useGlobal()
  const [unavailable, setUnavailable] = useState(false)
  const markers = useMemo(() => buildGlobeMarkers(countries), [countries])

  useEffect(() => {
    let globe
    let frame
    let disposed = false
    let phi = 0
    let frameCount = 0
    let webGLAvailable = false

    try {
      webGLAvailable = Boolean(
        canvasRef.current?.getContext('webgl2') ||
          canvasRef.current?.getContext('webgl')
      )
    } catch {
      webGLAvailable = false
    }

    if (!webGLAvailable) {
      setUnavailable(true)
      return
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    import('cobe')
      .then(({ default: createGlobe }) => {
        if (disposed || !canvasRef.current) return
        globe = createGlobe(canvasRef.current, {
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          width: size * 2,
          height: size * 2,
          phi: 0,
          theta: 0.22,
          dark: isDarkMode ? 1 : 0,
          diffuse: 1.25,
          mapSamples: compact ? 9000 : 14000,
          mapBrightness: isDarkMode ? 3 : 6,
          baseColor: isDarkMode ? [0.22, 0.24, 0.32] : [0.32, 0.36, 0.48],
          markerColor: [0.58, 0.55, 0.93],
          glowColor: isDarkMode ? [0.12, 0.13, 0.2] : [0.9, 0.91, 0.98],
          markers
        })

        const render = () => {
          if (disposed) return
          if (!reducedMotion) phi += compact ? 0.003 : 0.002
          globe.update({ phi })
          frameCount += 1
          if (!reducedMotion || frameCount < 60) {
            frame = window.requestAnimationFrame(render)
          }
        }
        frame = window.requestAnimationFrame(render)
      })
      .catch(() => setUnavailable(true))

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      globe?.destroy()
    }
  }, [compact, isDarkMode, markers, size])

  if (unavailable) {
    return (
      <div className='flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 min-h-32'>
        全球足迹暂不可用
      </div>
    )
  }

  return (
    <div
      className='relative flex justify-center overflow-hidden'
      aria-label='访客国家分布地球图'
    >
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        className='max-w-full h-auto cursor-grab'
        style={{ width: size, height: size }}
      />
    </div>
  )
}
