import { render, screen } from '@testing-library/react'
import DashboardItemHome from '@/components/ui/dashboard/DashboardItemHome'
import useAnalyticsSummary from '@/hooks/useAnalyticsSummary'

jest.mock('@/hooks/useAnalyticsSummary')
jest.mock(
  '@/components/analytics/VisitorGlobe',
  () =>
    function MockGlobe() {
      return <div data-testid='visitor-globe' />
    }
)
jest.mock(
  '@/components/analytics/AnalyticsTrendChart',
  () =>
    function MockChart() {
      return <div data-testid='trend-chart' />
    }
)
jest.mock(
  '@/components/SmartLink',
  () =>
    function MockLink({ children, href, ...props }) {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    }
)

describe('public analytics dashboard', () => {
  it('renders KPIs, top pages and country rankings', () => {
    useAnalyticsSummary.mockReturnValue({
      loading: false,
      error: null,
      retry: jest.fn(),
      data: {
        updatedAt: '2026-10-03T12:00:00.000Z',
        summary: {
          sevenDayUsers: 12,
          sevenDayViews: 34,
          allTimeUsers: 56,
          allTimeViews: 78
        },
        trend: [{ date: '2026-10-03', users: 12, views: 34 }],
        topPages: [
          { path: '/article/example', title: 'Example article', views: 20 }
        ],
        countries: [
          { code: 'CN', name: 'China', users: 10, latitude: 35, longitude: 105 }
        ]
      }
    })

    render(<DashboardItemHome pageIcons={[{ path: '/article/example', icon: '🪐' }]} />)

    expect(
      screen.getByRole('heading', { name: '世界从哪里来？' })
    ).toBeInTheDocument()
    expect(screen.getByText('近7天用户')).toBeInTheDocument()
    expect(screen.getByText('累计浏览量')).toBeInTheDocument()
    expect(screen.getByText('Example article')).toBeInTheDocument()
    expect(screen.getByText('🪐')).toBeInTheDocument()
    expect(screen.getByText('China')).toBeInTheDocument()
    expect(screen.getByText('🇨🇳')).toBeInTheDocument()
    expect(screen.getByText('20 次浏览')).toBeInTheDocument()
    expect(screen.getByTestId('visitor-globe')).toBeInTheDocument()
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
  })
})
