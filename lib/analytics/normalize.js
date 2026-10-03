import worldCountries from 'world-countries'

const COUNTRY_BY_CODE = new Map(
  worldCountries.map(country => [country.cca2, country])
)

const numberValue = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const rowMetric = (report, metricIndex, rowIndex = 0) =>
  numberValue(report?.rows?.[rowIndex]?.metricValues?.[metricIndex]?.value)

const formatGaDate = value => {
  if (!/^\d{8}$/.test(value || '')) {
    return value || ''
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

const normalizeTrend = report =>
  (report?.rows || []).map(row => ({
    date: formatGaDate(row.dimensionValues?.[0]?.value),
    users: numberValue(row.metricValues?.[0]?.value),
    views: numberValue(row.metricValues?.[1]?.value)
  }))

const normalizeTopPages = report =>
  (report?.rows || []).map(row => {
    const path = row.dimensionValues?.[0]?.value || '/'
    const title = row.dimensionValues?.[1]?.value || path
    return {
      path,
      title,
      views: numberValue(row.metricValues?.[0]?.value)
    }
  })

const normalizeCountries = report =>
  (report?.rows || [])
    .map(row => {
      const code = row.dimensionValues?.[0]?.value?.toUpperCase()
      const name = row.dimensionValues?.[1]?.value
      const country = COUNTRY_BY_CODE.get(code)
      const [latitude, longitude] = country?.latlng || []

      if (!code || code === '(NOT SET)' || !country) {
        return null
      }

      return {
        code,
        name: name && name !== '(not set)' ? name : country.name.common,
        users: numberValue(row.metricValues?.[0]?.value),
        latitude,
        longitude
      }
    })
    .filter(Boolean)

export const normalizeAnalyticsReports = (reports = [], now = new Date()) => ({
  updatedAt: now.toISOString(),
  summary: {
    sevenDayUsers: rowMetric(reports[0], 0),
    sevenDayViews: rowMetric(reports[0], 1),
    allTimeUsers: rowMetric(reports[1], 0),
    allTimeViews: rowMetric(reports[1], 1)
  },
  trend: normalizeTrend(reports[2]),
  topPages: normalizeTopPages(reports[3]),
  countries: normalizeCountries(reports[4])
})
