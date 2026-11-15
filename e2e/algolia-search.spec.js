const { test, expect } = require('@playwright/test')

test('searches the end of a long article and opens its original heading', async ({
  page
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_ALGOLIA_ENABLED,
    'Requires the configured production search index'
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator('div[title="搜索"]:visible').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox').fill('四级合成退化参数')
  const result = dialog.getByRole('link', { name: /ICLR 2026/ })
  await expect(result).toBeVisible({ timeout: 30000 })
  await expect(result).toContainText('合成退化参数')
  const href = await result.getAttribute('href')
  expect(href).toContain('/article/uncertainty-ocr-iclr2026-zh#')
  await result.click()
  await page.waitForURL(
    url =>
      url.pathname === '/article/uncertainty-ocr-iclr2026-zh' &&
      Boolean(url.hash)
  )
  await expect(page.locator(`[id="${href.split('#')[1]}"]`)).toBeInViewport()
})
