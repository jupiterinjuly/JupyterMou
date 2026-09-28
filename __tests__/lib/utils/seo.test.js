import {
  buildStructuredData,
  getArticleSeoMeta,
  getCanonicalUrl,
  getSitemapPath,
  isSearchRoute
} from '@/lib/utils/seo'

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

  describe('article metadata', () => {
    const post = {
      title: '一些AI工具及AIGC应用',
      summary: '文章摘要',
      type: 'Post',
      slug: 'article/ai-learning',
      pageCoverThumbnail: '/cover.jpg',
      category: '技术分享',
      tags: ['AI', 'AIGC'],
      publishDay: '2026-2-19',
      lastEditedDay: '2026-9-27'
    }
    const siteInfo = {
      title: 'JupyterMou’s Notes｜序秋随笔',
      pageCover: '/site-cover.jpg',
      icon: '/avatar.png'
    }

    it('keeps the full category and article dates', () => {
      expect(getArticleSeoMeta(post, siteInfo)).toEqual(
        expect.objectContaining({
          title: '一些AI工具及AIGC应用 | JupyterMou’s Notes｜序秋随笔',
          headline: '一些AI工具及AIGC应用',
          category: '技术分享',
          publishDay: '2026-02-19',
          lastEditedDay: '2026-09-27'
        })
      )
    })

    it('builds complete BlogPosting structured data', () => {
      const meta = getArticleSeoMeta(post, siteInfo)
      const data = buildStructuredData({
        meta,
        siteInfo,
        url: 'https://www.jupytermou.cn/article/ai-learning',
        image: 'https://www.jupytermou.cn/cover.jpg',
        author: 'Jupyter Mou',
        siteUrl: 'https://www.jupytermou.cn'
      })

      expect(data).toEqual(
        expect.objectContaining({
          '@type': 'BlogPosting',
          headline: '一些AI工具及AIGC应用',
          articleSection: '技术分享',
          datePublished: '2026-02-19',
          dateModified: '2026-09-27',
          author: {
            '@type': 'Person',
            name: 'Jupyter Mou',
            url: 'https://www.jupytermou.cn/about'
          }
        })
      )
    })
  })
})
