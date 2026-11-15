// Hold a deep link steady while late fonts and lazy images change page height.
// Stop immediately when the reader interacts, or after the initial load window.
export function stabilizeArticleHash(root) {
  let id
  try {
    id = decodeURIComponent(window.location.hash.slice(1))
  } catch {
    return () => {}
  }
  const anchor = id && document.getElementById(id)
  if (!anchor || !root?.contains(anchor)) return () => {}
  const heading = anchor.classList.contains('notion-header-anchor')
    ? anchor.parentElement
    : anchor
  let stopped = false,
    frame = null
  const align = () => {
    frame = null
    if (stopped || !heading.isConnected) return
    const top = heading.getBoundingClientRect().top
    if (Math.abs(top - 96) < 3) return
    const style = document.documentElement.style
    const previous = style.scrollBehavior
    style.scrollBehavior = 'auto'
    window.scrollTo({ top: window.scrollY + top - 96, behavior: 'auto' })
    style.scrollBehavior = previous
  }
  const schedule = () => {
    if (!stopped && frame === null) frame = requestAnimationFrame(align)
  }
  const observer =
    typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
  const events = ['wheel', 'touchstart', 'pointerdown', 'keydown']
  const stop = () => {
    stopped = true
    clearTimeout(deadline)
    if (frame !== null) cancelAnimationFrame(frame)
    observer?.disconnect()
    root.removeEventListener('load', schedule, true)
    window.removeEventListener('resize', schedule)
    document.fonts?.removeEventListener?.('loadingdone', schedule)
    events.forEach(event => window.removeEventListener(event, stop, true))
  }
  const deadline = setTimeout(stop, 8000)
  observer?.observe(root)
  root.addEventListener('load', schedule, true)
  window.addEventListener('resize', schedule)
  document.fonts?.addEventListener?.('loadingdone', schedule)
  events.forEach(event =>
    window.addEventListener(event, stop, { capture: true, passive: true })
  )
  schedule()
  return stop
}
