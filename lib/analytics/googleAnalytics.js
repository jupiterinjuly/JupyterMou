import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { normalizeAnalyticsReports } from './normalize'

const SUMMARY_METRICS = [{ name: 'activeUsers' }, { name: 'screenPageViews' }]

const reportRequests = [
  {
    dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }],
    metrics: SUMMARY_METRICS
  },
  {
    dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
    metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }]
  },
  {
    dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: SUMMARY_METRICS,
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  {
    dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5
  },
  {
    dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
    dimensions: [{ name: 'countryId' }, { name: 'country' }],
    metrics: [{ name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 250
  }
]

export const hasAnalyticsCredentials = () =>
  Boolean(
    process.env.GA_PROPERTY_ID &&
      process.env.GA_CLIENT_EMAIL &&
      process.env.GA_PRIVATE_KEY
  )

export const fetchAnalyticsSummary = async () => {
  if (!hasAnalyticsCredentials()) {
    const error = new Error('Analytics service is not configured')
    error.code = 'ANALYTICS_NOT_CONFIGURED'
    throw error
  }

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA_CLIENT_EMAIL,
      private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  })

  const [response] = await client.batchRunReports({
    property: `properties/${process.env.GA_PROPERTY_ID}`,
    requests: reportRequests
  })

  return normalizeAnalyticsReports(response.reports)
}

export { reportRequests }
