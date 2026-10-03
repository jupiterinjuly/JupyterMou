import { useCallback, useEffect, useState } from 'react'

const REFRESH_INTERVAL = 30 * 60 * 1000

export default function useAnalyticsSummary() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async signal => {
    try {
      const response = await fetch('/api/analytics/summary', { signal })
      if (!response.ok) {
        throw new Error('Analytics request failed')
      }
      const nextData = await response.json()
      setData(nextData)
      setError(null)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError)
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    const interval = window.setInterval(() => {
      void load()
    }, REFRESH_INTERVAL)

    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [load])

  return { data, error, loading, retry: () => load() }
}

export { REFRESH_INTERVAL }
