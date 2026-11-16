const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  test.skip(
    !process.env.PLAYWRIGHT_CHAT_ENABLED,
    'Requires article chat enabled'
  )
  if (process.env.PLAYWRIGHT_VERCEL_AUTH_FILE) {
    const auth = require(process.env.PLAYWRIGHT_VERCEL_AUTH_FILE)
    const origin = new URL(process.env.PLAYWRIGHT_BASE_URL).origin
    // Attach the protection token only to our deployment, never analytics/CDNs.
    await page.route(
      url => url.origin === origin,
      route =>
        route.continue({
          headers: { ...route.request().headers(), ...auth.headers }
        })
    )
  }
  // Browser fixtures do not consume paid tokens; live model evaluation is separate.
  await page.route('**/api/article-chat', route =>
    route.fulfill({
      json: {
        answer: '文中讨论了 OCR 的不确定性[1]。',
        grounded: true,
        sources: [
          {
            id: 1,
            title: 'ICLR 2026 中文译文',
            section: '实验',
            href: '/article/uncertainty-ocr-iclr2026-zh#03e1b6dcb04f4a3bb1263e8a7297438b'
          }
        ]
      }
    })
  )
})

test('home chat asks, displays citations, fits viewport and handles Escape', async ({
  page
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '和文章聊一聊' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: '问当前文章', exact: true })
  ).toBeDisabled()
  const box = dialog.getByRole('textbox', { name: '你的问题' })
  await expect(box).toBeFocused()
  await box.fill('OCR 不确定性是什么？')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toBeVisible()
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toHaveAttribute(
    'href',
    /\/article\/.*#/
  )
  const bounds = await dialog.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: '打开文章问答', exact: true })
  ).toBeFocused()
})

test('article scope resets on switch; throttling keeps question for retry', async ({
  page
}) => {
  await page.goto('/article/uncertainty-ocr-iclr2026-zh', {
    waitUntil: 'domcontentloaded'
  })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '和文章聊一聊' })
  await expect(
    dialog.getByRole('button', { name: '问当前文章', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  const box = dialog.getByRole('textbox', { name: '你的问题' })
  await box.fill('这篇文章提到哪些实验？')
  const request = page.waitForRequest(req =>
    req.url().endsWith('/api/article-chat')
  )
  await dialog.getByRole('button', { name: '发送问题' }).click()
  expect((await request).postDataJSON()).toMatchObject({ scope: 'article' })
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toBeVisible()
  await dialog
    .getByRole('button', { name: '搜索全站文章', exact: true })
    .click()
  await expect(
    dialog.getByRole('link', { name: /查看来源1/ })
  ).not.toBeVisible()
  await page.route('**/api/article-chat', route =>
    route.fulfill({ status: 429, json: { error: '限流' } })
  )
  await box.fill('继续问一个问题')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  await expect(dialog.getByRole('alert')).toContainText('提问有些频繁')
  await expect(box).toHaveValue('继续问一个问题')
})

test('eight-question conversation limit can be cleared deliberately', async ({
  page
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '和文章聊一聊' })
  for (let i = 0; i < 8; i++) {
    await dialog
      .getByRole('textbox', { name: '你的问题' })
      .fill(`第${i + 1}个问题`)
    await dialog.getByRole('button', { name: '发送问题' }).click()
    await expect(dialog.getByRole('link', { name: /查看来源1/ })).toHaveCount(
      i + 1
    )
  }
  await expect(
    dialog.getByText('本轮已聊了8个问题，开启新对话后可以继续。')
  ).toBeVisible()
  await dialog.getByRole('textbox', { name: '你的问题' }).fill('第九个问题')
  await expect(dialog.getByRole('button', { name: '发送问题' })).toBeDisabled()
  await dialog.getByRole('button', { name: '开启新对话' }).click()
  await expect(dialog.getByRole('textbox', { name: '你的问题' })).toHaveValue(
    ''
  )
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toHaveCount(0)
})
