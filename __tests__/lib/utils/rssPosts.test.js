import { getFeedPosts } from '@/lib/utils/rssPosts'

it('includes older published articles omitted by the recent-updates sidebar', () => {
  const posts = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    type: 'Post',
    status: 'Published',
    publishDate: Date.UTC(2026, 10, index + 1)
  }))
  const result = getFeedPosts({
    allPages: posts,
    latestPosts: posts.slice(0, 6)
  })
  expect(result).toHaveLength(12)
  expect(result[0].id).toBe('11')
  expect(result[11].id).toBe('0')
  expect(posts[0].id).toBe('0')
})

it('excludes drafts, hidden pages, menus and password-protected articles', () => {
  const published = { type: 'Post', status: 'Published', id: 'public' }
  expect(
    getFeedPosts({
      allPages: [
        published,
        { ...published, id: 'draft', status: 'Draft' },
        { ...published, id: 'hidden', status: 'Invisible' },
        { ...published, id: 'menu', type: 'Menu' },
        { ...published, id: 'protected', password: 'protected' }
      ]
    })
  ).toEqual([published])
})
