import { fireEvent, render, screen } from '@testing-library/react'
import AnalyticsTrendChart from '@/components/analytics/AnalyticsTrendChart'

describe('AnalyticsTrendChart', () => {
  it('reveals both values for a hovered or focused day', () => {
    render(
      <AnalyticsTrendChart
        trend={[
          { date: '2026-10-02', users: 3, views: 9 },
          { date: '2026-10-03', users: 5, views: 12 }
        ]}
      />
    )

    const point = screen.getByRole('button', { name: /10月3日/ })
    fireEvent.mouseEnter(point)
    expect(screen.getByText('12 次浏览')).toBeInTheDocument()
    expect(screen.getByText('5 位用户')).toBeInTheDocument()

    fireEvent.mouseLeave(point)
    expect(screen.queryByText('12 次浏览')).not.toBeInTheDocument()

    fireEvent.focus(point)
    expect(screen.getByText('12 次浏览')).toBeInTheDocument()

    fireEvent.mouseEnter(document.querySelectorAll('[data-series="users"]')[0])
    expect(screen.getByText('9 次浏览')).toBeInTheDocument()
  })
})
