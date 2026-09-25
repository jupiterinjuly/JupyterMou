import { siteConfig } from '@/lib/config'
import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_RETRY_COUNT = 2
const DEFAULT_TIMEOUT_MS = 9000
const DEFAULT_RETRY_DELAY_MS = 600

/**
 * A lazy image with timeout, automatic retry and a manual retry fallback.
 * Images are only exposed to the visible <img> while an attempt is active, so
 * visitors never get stuck with the browser's broken-image icon.
 */
export default function LazyImage(props) {
  const {
    priority = false,
    id,
    src,
    alt,
    placeholderSrc,
    className,
    width,
    height,
    title,
    onLoad,
    onClick,
    onError,
    style,
    loading,
    decoding = 'async',
    fetchPriority,
    retryCount = DEFAULT_RETRY_COUNT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS
  } = props
  const maxWidth = siteConfig('IMAGE_COMPRESS_WIDTH')
  const defaultPlaceholderSrc = siteConfig('IMG_LAZY_LOAD_PLACEHOLDER')
  const fallbackSrc = placeholderSrc || defaultPlaceholderSrc
  const imageRef = useRef(null)
  const attemptControllerRef = useRef(null)
  const [currentSrc, setCurrentSrc] = useState(fallbackSrc)
  const [attempt, setAttempt] = useState(priority ? 0 : null)
  const [loadState, setLoadState] = useState('idle')
  const [retryToken, setRetryToken] = useState(0)

  const adjustedImageSrc = useMemo(
    () => adjustImgSize(normalizeNotionFileUrl(src), maxWidth),
    [src, maxWidth]
  )

  useEffect(() => {
    setCurrentSrc(fallbackSrc)
    setLoadState('idle')
    setAttempt(priority ? 0 : null)
  }, [adjustedImageSrc, fallbackSrc, priority])

  useEffect(() => {
    if (!adjustedImageSrc || priority || attempt !== null) return

    if (!window.IntersectionObserver) {
      setAttempt(0)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setAttempt(0)
          observer.disconnect()
        }
      },
      {
        rootMargin: siteConfig('LAZY_LOAD_THRESHOLD', '200px'),
        threshold: 0.1
      }
    )

    const image = imageRef.current
    if (image) observer.observe(image)

    return () => observer.disconnect()
  }, [adjustedImageSrc, attempt, priority])

  // One effect represents one request attempt. Failed attempts wait with an
  // exponential backoff before trying again: 600ms, then 1200ms by default.
  useEffect(() => {
    if (!adjustedImageSrc || attempt === null) return

    let settled = false
    let retryTimer
    let timeoutTimer

    const clearTimers = () => {
      clearTimeout(retryTimer)
      clearTimeout(timeoutTimer)
    }

    const fail = event => {
      if (settled) return
      settled = true
      clearTimers()
      setCurrentSrc(fallbackSrc)

      if (attempt < retryCount) {
        setAttempt(attempt + 1)
      } else {
        setLoadState('error')
        if (typeof onError === 'function') onError(event)
      }
    }

    const succeed = event => {
      if (settled) return
      settled = true
      clearTimers()
      setLoadState('loaded')
      imageRef.current?.classList.remove('lazy-image-placeholder')
      if (typeof onLoad === 'function') onLoad(event)
    }

    attemptControllerRef.current = { fail, succeed }
    setLoadState('loading')
    setCurrentSrc(fallbackSrc)

    const delay = attempt === 0 ? 0 : retryDelayMs * 2 ** (attempt - 1)
    retryTimer = setTimeout(() => {
      if (settled) return
      setCurrentSrc(adjustedImageSrc)
      timeoutTimer = setTimeout(() => fail(), timeoutMs)
    }, delay)

    return () => {
      settled = true
      clearTimers()
      if (attemptControllerRef.current?.fail === fail) {
        attemptControllerRef.current = null
      }
    }
  }, [
    adjustedImageSrc,
    attempt,
    fallbackSrc,
    onError,
    onLoad,
    retryCount,
    retryDelayMs,
    retryToken,
    timeoutMs
  ])

  if (!src) return null

  const retryManually = event => {
    event.preventDefault()
    event.stopPropagation()
    setCurrentSrc(fallbackSrc)
    setLoadState('idle')
    setAttempt(0)
    setRetryToken(token => token + 1)
  }

  const retryWithKeyboard = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      retryManually(event)
    }
  }

  if (loadState === 'error') {
    return (
      <span
        id={id}
        role='button'
        tabIndex={0}
        className={`${className || ''} retry-image-fallback`}
        style={style}
        title={title || '点击重新加载图片'}
        aria-label={`${alt || '图片'}加载失败，点击重试`}
        onClick={retryManually}
        onKeyDown={retryWithKeyboard}
      >
        <span className='retry-image-fallback-icon' aria-hidden='true'>
          ↻
        </span>
        <span>图片加载失败，点击重试</span>
      </span>
    )
  }

  const handleLoad = event => {
    if (currentSrc === adjustedImageSrc) {
      attemptControllerRef.current?.succeed(event)
    }
  }

  const handleError = event => {
    if (currentSrc === adjustedImageSrc) {
      attemptControllerRef.current?.fail(event)
    }
  }

  const imgProps = {
    ref: imageRef,
    src: currentSrc,
    'data-src': src,
    alt: alt || '图片',
    onLoad: handleLoad,
    onError: handleError,
    className: `${className || ''} ${
      loadState === 'loaded' ? '' : 'lazy-image-placeholder'
    }`,
    style,
    onClick,
    loading: loading || (priority ? 'eager' : 'lazy'),
    decoding,
    fetchpriority: fetchPriority || (priority ? 'high' : 'auto'),
    ...(siteConfig('WEBP_SUPPORT') && { 'data-webp': true }),
    ...(siteConfig('AVIF_SUPPORT') && { 'data-avif': true })
  }

  if (id) imgProps.id = id
  if (title) imgProps.title = title
  if (width) imgProps.width = width
  if (height) imgProps.height = height

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...imgProps} alt={imgProps.alt} />
      {priority && adjustedImageSrc && (
        <Head>
          <link rel='preload' as='image' href={adjustedImageSrc} />
        </Head>
      )}
    </>
  )
}

/**
 * Convert both generations of Notion signed file URLs to a stable image URL.
 */
const normalizeNotionFileUrl = src => {
  if (!/^https:\/\/file\.notion\.(so|com)\//.test(src || '')) return src

  try {
    const url = new URL(src)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const fileId = pathParts[3]
    const fileName = decodeURIComponent(pathParts.slice(4).join('/'))
    const recordId = url.searchParams.get('id')
    const table = url.searchParams.get('table') || 'block'

    if (!fileId || !fileName || !recordId) return src

    const attachment = encodeURIComponent(`attachment:${fileId}:${fileName}`)
    return `https://www.notion.so/image/${attachment}?table=${encodeURIComponent(table)}&id=${encodeURIComponent(recordId)}`
  } catch {
    return src
  }
}

/**
 * Match remote image parameters to the visitor's screen where supported.
 */
const adjustImgSize = (src, maxWidth) => {
  if (!src) return null

  const screenWidth =
    (typeof window !== 'undefined' && window?.screen?.width) || maxWidth

  if (screenWidth > maxWidth) return src

  return src
    .replace(/width=\d+/, `width=${screenWidth}`)
    .replace(/w=\d+/, `w=${screenWidth}`)
}
