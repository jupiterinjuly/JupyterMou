import handler from '@/pages/api/analytics/summary'
import { fetchAnalyticsSummary } from '@/lib/analytics/googleAnalytics'

jest.mock('@/lib/analytics/googleAnalytics', () => ({
  fetchAnalyticsSummary: jest.fn()
}))

const createResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: jest.fn((key, value) => {
      response.headers[key] = value
    }),
    status: jest.fn(code => {
      response.statusCode = code
      return response
    }),
    json: jest.fn(body => {
      response.body = body
      return response
    })
  }
  return response
}

describe('/api/analytics/summary', () => {
  it('returns cached aggregate analytics without credentials', async () => {
    fetchAnalyticsSummary.mockResolvedValue({
      updatedAt: '2026-10-03T12:00:00.000Z',
      summary: { sevenDayUsers: 1, sevenDayViews: 2 }
    })
    const response = createResponse()

    await handler({ method: 'GET' }, response)

    expect(response.statusCode).toBe(200)
    expect(response.headers['Cache-Control']).toContain('s-maxage=1800')
    expect(response.body).not.toHaveProperty('GA_PRIVATE_KEY')
    expect(JSON.stringify(response.body)).not.toContain('private_key')
  })

  it('rejects non-GET methods', async () => {
    const response = createResponse()

    await handler({ method: 'POST' }, response)

    expect(response.statusCode).toBe(405)
    expect(response.headers.Allow).toBe('GET')
    expect(fetchAnalyticsSummary).not.toHaveBeenCalled()
  })

  it('returns a controlled configuration error', async () => {
    const error = new Error('secret details')
    error.code = 'ANALYTICS_NOT_CONFIGURED'
    fetchAnalyticsSummary.mockRejectedValue(error)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const response = createResponse()

    await handler({ method: 'GET' }, response)

    expect(response.statusCode).toBe(503)
    expect(response.body).toEqual({ error: 'Analytics is not configured' })
    expect(response.headers['Cache-Control']).toBe('private, no-store')
  })
})
