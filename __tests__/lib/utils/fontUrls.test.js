import { resolveFontUrls } from '@/lib/utils/fontUrls'

test('serves the existing WenKai font from the site while retaining custom fonts', () => {
  expect(
    resolveFontUrls([
      'https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css',
      '/custom.css'
    ])
  ).toEqual(['/fonts/lxgw-wenkai-1.6.0/style.css', '/custom.css'])
  expect(resolveFontUrls(null)).toEqual([])
})
