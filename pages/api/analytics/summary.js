import { fetchAnalyticsSummary } from '@/lib/analytics/googleAnalytics'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const analytics = await fetchAnalyticsSummary()
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=1800, stale-while-revalidate=86400'
    )
    return res.status(200).json(analytics)
  } catch (error) {
    const notConfigured = error?.code === 'ANALYTICS_NOT_CONFIGURED'
    console.error(
      '[analytics] Unable to load summary:',
      notConfigured ? 'service not configured' : error?.message
    )
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(notConfigured ? 503 : 502).json({
      error: notConfigured
        ? 'Analytics is not configured'
        : 'Analytics is temporarily unavailable'
    })
  }
}
