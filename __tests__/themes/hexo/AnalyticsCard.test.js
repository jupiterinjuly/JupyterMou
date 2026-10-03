import { render, screen } from '@testing-library/react'
import { AnalyticsCard } from '@/themes/hexo/components/AnalyticsCard'
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

describe('Hexo analytics card', () => {
  it('shows aggregate metrics and links to the dashboard', () => {
    useAnalyticsSummary.mockReturnValue({
      loading: false,
      error: null,
      data: {
        summary: {
          allTimeViews: 1234,
          sevenDayUsers: 25,
          sevenDayViews: 87
        },
        countries: []
      }
    })

    render(<AnalyticsCard />)

    expect(screen.getByText('站点足迹')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByTestId('visitor-globe')).toBeInTheDocument()
  })

  it('shows a quiet fallback when analytics fail', () => {
    useAnalyticsSummary.mockReturnValue({
      loading: false,
      error: new Error('offline'),
      data: null
    })

    render(<AnalyticsCard />)

    expect(screen.getByText('统计数据暂不可用')).toBeInTheDocument()
  })
})
