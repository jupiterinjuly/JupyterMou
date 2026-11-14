const { test, expect } = require('@playwright/test')

test('home keeps the personal layout and hides database metadata', async ({
  page
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#theme-hexo')).toBeVisible()
  await expect(page.locator('body')).toContainText('Jupyter Mou')
  await expect(page.locator('body')).toContainText('站点足迹')
  await expect(page.locator('#announcement-content')).toHaveCount(1)
  await expect(
    page.locator('#announcement-content .notion-collection-row')
  ).toHaveCount(0)
  await expect(
    page.locator('link[rel="alternate"][type="application/rss+xml"]')
  ).toHaveAttribute('href', 'https://www.jupytermou.cn/rss/feed.xml')
  const fontUrls = () =>
    page
      .locator('link[rel="stylesheet"]')
      .evaluateAll(links => links.map(link => link.href))
  await expect
    .poll(fontUrls)
    .toContain('https://npm.elemecdn.com/lxgw-wenkai-webfont@1.6.0/style.css')
  expect(
    (await fontUrls()).some(url => url.includes('fonts.googleapis.com'))
  ).toBe(false)
})

test('all public posts are available in a current feed', async ({
  request
}) => {
  test.setTimeout(120_000)
  const response = await request.get('/rss/feed.json', { timeout: 110_000 })
  expect(response.status()).toBe(200)
  const feed = await response.json()
  expect(feed.items.length).toBeGreaterThan(6)
  expect(feed.items.some(item => item.url.includes('par-faithful-ocr'))).toBe(
    true
  )
  expect(
    feed.items.every(item => item.url.startsWith('https://www.jupytermou.cn/'))
  ).toBe(true)
  expect(response.headers()['content-type']).toContain('application/json')
})

test('analytics still returns real summary data', async ({ request }) => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL,
    'Production analytics credentials stay in Vercel'
  )
  const response = await request.get('/api/analytics/summary')
  expect(response.status()).toBe(200)
  const data = await response.json()
  expect(data.summary.allTimeViews).toBeGreaterThan(0)
  expect(Array.isArray(data.trend)).toBe(true)
})

test('both interactive HTML replays remain usable', async ({ page }) => {
  await page.goto('/article/lllg-lifelong-mapf-reproduction', {
    waitUntil: 'domcontentloaded'
  })
  const replay = page.locator('iframe[title="LLLG-算法交互讲解.html"]')
  await expect(replay).toHaveAttribute('srcdoc', /<html/i, { timeout: 30_000 })
  await expect(
    page.locator('iframe[title="LLLG-实验交互分析.html"]')
  ).toHaveAttribute('srcdoc', /<html/i)
  await expect(replay).toHaveAttribute('sandbox', 'allow-scripts')
  const expand = page
    .getByRole('button', { name: '展开回放', exact: true })
    .first()
  await expand.click()
  await expect(replay).toHaveCSS('height', '1100px')
})
