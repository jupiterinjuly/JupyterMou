import { buildGlobeMarkers } from '@/lib/analytics/globe'
import { reportRequests } from '@/lib/analytics/googleAnalytics'
import { normalizeAnalyticsReports } from '@/lib/analytics/normalize'

const metric = value => ({ value: String(value) })
const dimension = value => ({ value })

describe('analytics report normalization', () => {
  it('uses an inclusive seven-day range for recent reports', () => {
    expect(reportRequests[0].dateRanges[0]).toEqual({
      startDate: '6daysAgo',
      endDate: 'today'
    })
    expect(reportRequests[2].dateRanges[0]).toEqual(
      reportRequests[0].dateRanges[0]
    )
    expect(reportRequests[3].dateRanges[0]).toEqual(
      reportRequests[0].dateRanges[0]
    )
  })

  it('normalizes summaries, trends, popular pages and countries', () => {
    const reports = [
      { rows: [{ metricValues: [metric(12), metric(34)] }] },
      { rows: [{ metricValues: [metric(56), metric(78)] }] },
      {
        rows: [
          {
            dimensionValues: [dimension('20261001')],
            metricValues: [metric(4), metric(9)]
          },
          {
            dimensionValues: [dimension('20261002')],
            metricValues: [metric(8), metric(15)]
          }
        ]
      },
      {
        rows: [
          {
            dimensionValues: [
              dimension('/article/example'),
              dimension('Example')
            ],
            metricValues: [metric(18)]
          }
        ]
      },
      {
        rows: [
          {
            dimensionValues: [dimension('CN'), dimension('China')],
            metricValues: [metric(11)]
          },
          {
            dimensionValues: [dimension('(not set)'), dimension('(not set)')],
            metricValues: [metric(3)]
          }
        ]
      }
    ]

    const result = normalizeAnalyticsReports(
      reports,
      new Date('2026-10-03T12:00:00.000Z')
    )

    expect(result.summary).toEqual({
      sevenDayUsers: 12,
      sevenDayViews: 34,
      allTimeUsers: 56,
      allTimeViews: 78
    })
    expect(result.trend).toEqual([
      { date: '2026-10-01', users: 4, views: 9 },
      { date: '2026-10-02', users: 8, views: 15 }
    ])
    expect(result.topPages).toEqual([
      { path: '/article/example', title: 'Example', views: 18 }
    ])
    expect(result.countries).toEqual([
      {
        code: 'CN',
        name: 'China',
        users: 11,
        latitude: 35,
        longitude: 105
      }
    ])
    expect(result.updatedAt).toBe('2026-10-03T12:00:00.000Z')
  })

  it('returns a stable empty shape for missing rows', () => {
    const result = normalizeAnalyticsReports([], new Date(0))

    expect(result).toEqual({
      updatedAt: '1970-01-01T00:00:00.000Z',
      summary: {
        sevenDayUsers: 0,
        sevenDayViews: 0,
        allTimeUsers: 0,
        allTimeViews: 0
      },
      trend: [],
      topPages: [],
      countries: []
    })
  })

  it('builds bounded globe markers and skips invalid coordinates', () => {
    const markers = buildGlobeMarkers([
      { code: 'CN', latitude: 35, longitude: 105, users: 1000 },
      { code: 'US', latitude: 38, longitude: -97, users: 1 },
      { code: 'XX', latitude: null, longitude: null, users: 20 }
    ])

    expect(markers).toHaveLength(2)
    expect(markers[0]).toEqual({ location: [35, 105], size: 0.09 })
    expect(markers[1].size).toBeGreaterThanOrEqual(0.025)
    expect(markers[1].size).toBeLessThanOrEqual(0.09)
  })
})
