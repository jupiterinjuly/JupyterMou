import { render, screen } from '@testing-library/react'
import Footer from '@/themes/hexo/components/Footer'
import PostHero from '@/themes/hexo/components/PostHero'

jest.mock('@/components/LazyImage', () => {
  return function MockLazyImage({ src }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt='' src={src} />
  }
})

jest.mock('@/components/NotionIcon', () => {
  return function MockNotionIcon() {
    return null
  }
})

jest.mock('@/components/SmartLink', () => {
  return function MockSmartLink({
    href,
    children,
    passHref,
    legacyBehavior,
    ...props
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

jest.mock('@/components/BeiAnGongAn', () => ({
  BeiAnGongAn: () => null
}))
jest.mock('@/components/BeiAnSite', () => () => null)
jest.mock('@/components/PoweredBy', () => () => null)

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({
    fullWidth: false,
    locale: {
      COMMON: {
        POST_TIME: '发布于',
        LAST_EDITED_TIME: '更新于',
        VIEWS: '浏览'
      }
    }
  })
}))

jest.mock('@/lib/config', () => ({
  siteConfig: key => {
    const values = {
      ANALYTICS_BUSUANZI_ENABLE: 'false',
      AUTHOR: 'Jupyter Mou',
      BIO: 'SZU AI',
      LINK: 'https://www.jupytermou.cn',
      POST_TITLE_ICON: false,
      SINCE: '2025'
    }
    return values[key] ?? ''
  }
}))

describe('Hexo article heading semantics', () => {
  it('uses the article title as the page h1', () => {
    render(
      <PostHero
        post={{
          title: '一些AI工具及AIGC应用',
          type: 'Post',
          category: '技术分享',
          publishDay: '2026-02-19',
          lastEditedDay: '2026-09-27',
          pageCover: '/cover.jpg'
        }}
        siteInfo={{ pageCover: '/site-cover.jpg' }}
      />
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '一些AI工具及AIGC应用'
      })
    ).toBeInTheDocument()
  })

  it('does not use the footer label as another h1', () => {
    render(<Footer title='JupyterMou’s Notes｜序秋随笔' />)

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByText(/JupyterMou’s Notes｜序秋随笔/)).toBeInTheDocument()
  })
})
