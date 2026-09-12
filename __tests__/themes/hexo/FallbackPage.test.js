import { fireEvent, render, screen } from '@testing-library/react'
import FallbackPage from '@/themes/hexo/components/FallbackPage'

const push = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ push })
}))

jest.mock('@/components/LazyImage', () => {
  return function MockLazyImage({ alt, src, className }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} className={className} />
  }
})

jest.mock('@/components/SmartLink', () => {
  return function MockSmartLink({ href, children, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

jest.mock('@/lib/config', () => ({
  siteConfig: () => ''
}))

jest.mock('@/themes/hexo/components/FallbackParticles', () => {
  return function MockFallbackParticles() {
    return <canvas aria-hidden='true' />
  }
})

jest.mock('styled-jsx/style', () => {
  function MockStyle() {
    return null
  }
  MockStyle.dynamic = () => ''
  return MockStyle
})

describe('Hexo fallback page', () => {
  const latestPosts = [
    {
      id: 'post-1',
      title: '第一次建站记录',
      href: '/first-site',
      pageCoverThumbnail: '/cover.jpg',
      publishDay: '2026-09-01'
    }
  ]

  beforeEach(() => {
    push.mockClear()
  })

  it('offers recovery actions and recent writing', () => {
    render(<FallbackPage latestPosts={latestPosts} statusCode={404} />)

    expect(screen.getByText('页面暂时跑丢啦')).toBeInTheDocument()
    expect(
      screen.getByText('试试问问 Jupiter，或从下面继续浏览。')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回首页' })).toBeInTheDocument()
    expect(screen.getAllByText('第一次建站记录')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /摄影与世界/ })).toHaveAttribute(
      'href',
      '/article/photography-portfolio'
    )
    expect(screen.getByRole('link', { name: /关于我/ })).toHaveAttribute(
      'href',
      '/about'
    )
  })

  it('turns a question into a site search', () => {
    render(<FallbackPage latestPosts={latestPosts} statusCode={404} />)

    fireEvent.change(screen.getByLabelText('问问 Jupiter'), {
      target: { value: '怎么开始学习 AI' }
    })
    fireEvent.submit(screen.getByRole('search'))

    expect(push).toHaveBeenCalledWith(
      '/search/%E6%80%8E%E4%B9%88%E5%BC%80%E5%A7%8B%E5%AD%A6%E4%B9%A0%20AI'
    )
  })

  it('uses a gentler message for server errors', () => {
    render(<FallbackPage latestPosts={[]} statusCode={500} />)

    expect(screen.getByText('页面暂时不可用')).toBeInTheDocument()
    expect(screen.queryByText('最近更新')).not.toBeInTheDocument()
  })
})
