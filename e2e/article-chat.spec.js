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
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: '问当前文章', exact: true })
  ).toBeDisabled()
  const box = dialog.getByRole('textbox', { name: '你的问题' })
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    await expect(box).toBeFocused()
  } else {
    await expect(box).not.toBeFocused()
  }
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

test('home initializes analytics without a hydration recovery', async ({
  page
}) => {
  const failures = []
  page.on('pageerror', error => {
    if (/Minified React error #(418|423)/.test(error.message))
      failures.push(error.message)
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: '打开文章问答', exact: true })
  ).toBeVisible()
  await expect(page.locator('#theme-hexo')).toBeVisible()
  expect(failures).toEqual([])
})

test('article scope resets on switch; throttling keeps question for retry', async ({
  page
}) => {
  await page.goto('/article/uncertainty-ocr-iclr2026-zh', {
    waitUntil: 'domcontentloaded'
  })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
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
    .getByRole('button', { name: '逛逛整个博客', exact: true })
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
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
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

test('planet hint, interests and refresh work without sending a question', async ({
  page,
  isMobile
}) => {
  let calls = 0
  page.on('request', req => {
    if (req.url().endsWith('/api/article-chat')) calls++
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const launcher = page.getByRole('button', {
    name: '打开文章问答',
    exact: true
  })
  if (!isMobile) {
    await launcher.hover()
    await expect(page.getByRole('tooltip')).toContainText('试着问我吧')
    await expect(page.getByRole('tooltip')).toBeVisible()
  }
  await launcher.click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  await expect(
    dialog.getByRole('heading', { name: '你好呀，今天想探索些什么？' })
  ).toBeVisible()
  await dialog.getByRole('button', { name: '技术与研究', exact: true }).click()
  await expect(
    dialog.getByRole('button', { name: '技术与研究', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  const suggestions = dialog.locator('[class*="suggestions"] button')
  const first = await suggestions.allTextContents()
  await dialog.getByRole('button', { name: '换一组' }).click()
  await expect.poll(() => suggestions.allTextContents()).not.toEqual(first)
  const second = await suggestions.allTextContents()
  expect(second.every(question => !first.includes(question))).toBe(true)
  expect(calls).toBe(0)
})

test('validated answers reveal progressively, can skip, and never replay on reopen', async ({
  page
}) => {
  const answer = '这是一段逐渐呈现的回答，用来检查阅读效果。'.repeat(25) + '[1]'
  await page.route('**/api/article-chat', route =>
    route.fulfill({
      json: {
        answer,
        sources: [{ id: 1, title: '测试来源', href: '/article/test' }]
      }
    })
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  await dialog.getByRole('textbox', { name: '你的问题' }).fill('检查逐渐显示')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  const skip = dialog.getByRole('button', { name: '立即显示全文' })
  await expect(skip).toBeVisible()
  const rendered = dialog.locator('[class*="answer"]')
  expect((await rendered.innerText()).length).toBeLessThan(answer.length)
  await skip.click()
  await expect(rendered).toHaveText(answer)
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toBeVisible()
  await page.getByRole('button', { name: '关闭文章问答' }).click()
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  await expect(rendered).toHaveText(answer)
  await expect(skip).toHaveCount(0)
})

test('reduced motion shows the full answer immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  await dialog.getByRole('textbox', { name: '你的问题' }).fill('检查减少动画')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  await expect(dialog.getByRole('link', { name: /查看来源1/ })).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: '立即显示全文' })
  ).toHaveCount(0)
})

test('reading older messages is not interrupted by progressive output', async ({
  page
}) => {
  const answer = '这段内容用于检查长回答的阅读与滚动。'.repeat(60)
  await page.route('**/api/article-chat', route =>
    route.fulfill({ json: { answer, sources: [] } })
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  const box = dialog.getByRole('textbox', { name: '你的问题' })
  await box.fill('第一条长回答')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  await dialog.getByRole('button', { name: '立即显示全文' }).click()
  await box.fill('继续一个问题')
  await dialog.getByRole('button', { name: '发送问题' }).click()
  await expect(
    dialog.getByRole('button', { name: '立即显示全文' })
  ).toBeVisible()
  const log = dialog.getByRole('log')
  await log.evaluate(el => {
    el.scrollTop = 0
    el.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  const last = dialog.locator('[class*="answer"]').last()
  const before = (await last.innerText()).length
  await expect
    .poll(async () => (await last.innerText()).length)
    .toBeGreaterThan(before + 30)
  expect(await log.evaluate(el => el.scrollTop)).toBe(0)
})

test('short viewport keeps the composer and close control reachable', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 450 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '打开文章问答', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '序秋小星球' })
  const bounds = await dialog.boundingBox()
  expect(bounds.y).toBeGreaterThanOrEqual(0)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(450)
  await expect(
    dialog.getByRole('textbox', { name: '你的问题' })
  ).toBeInViewport()
  await dialog.getByRole('button', { name: '关闭文章问答' }).click()
  await expect(dialog).not.toBeVisible()
})
