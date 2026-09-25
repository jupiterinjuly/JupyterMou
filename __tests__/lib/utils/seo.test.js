import { getCanonicalUrl, getSitemapPath, isSearchRoute } from '@/lib/utils/seo'

describe('SEO URL helpers', () => {
  describe('getSitemapPath', () => {
    it.each([
      ['article/ai-learning', 'article/ai-learning'],
      ['/about', 'about'],
      ['category/技术分享', 'category/技术分享']
    ])('keeps a valid internal path: %s', (value, expected) => {
      expect(getSitemapPath(value)).toBe(expected)
    })

    it.each([
      '',
      '#',
      '#section',
      'https://jupytermou.cn/about',
      'https://github.com/tangly1024/NotionNext',
      '//example.com/page',
      'mailto:hello@example.com',
      'search',
      '/search/NotionNext'
    ])('rejects a non-indexable sitemap value: %s', value => {
      expect(getSitemapPath(value)).toBeNull()
    })
  })

  describe('getCanonicalUrl', () => {
    it('joins the official site URL and route without duplicate slashes', () => {
      expect(
        getCanonicalUrl('https://www.jupytermou.cn/', '/article/ai-learning')
      ).toBe('https://www.jupytermou.cn/article/ai-learning')
    })

    it('keeps a trailing slash only for the home page', () => {
      expect(getCanonicalUrl('https://www.jupytermou.cn', '')).toBe(
        'https://www.jupytermou.cn/'
      )
    })
  })

  describe('isSearchRoute', () => {
    it.each(['/search', '/search/[keyword]', '/search/[keyword]/page/[page]'])(
      'recognizes search route %s',
      route => {
        expect(isSearchRoute(route)).toBe(true)
      }
    )

    it.each(['/', '/archive', '/article/[slug]'])(
      'keeps regular route %s indexable',
      route => {
        expect(isSearchRoute(route)).toBe(false)
      }
    )
  })
})
