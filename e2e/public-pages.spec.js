const { test, expect } = require('@playwright/test')

const publicPages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  {
    name: 'Tokyo gallery detail',
    path: '/3d400ef7c8a0804fa239f7162cf1612b',
    expectedText: '日本 · 东京'
  }
]

for (const publicPage of publicPages) {
  test(`${publicPage.name} renders valid content`, async ({ page }) => {
    const response = await page.goto(publicPage.path, {
      waitUntil: 'domcontentloaded'
    })

    expect(
      response,
      `${publicPage.path} did not return a document`
    ).not.toBeNull()
    expect(
      response.status(),
      `${publicPage.path} returned an error`
    ).toBeLessThan(400)

    const body = page.locator('body')
    await expect(body).toBeVisible()
    await expect
      .poll(async () => (await body.innerText()).trim().length)
      .toBeGreaterThan(100)

    for (const invalidText of [
      'Invalid Date',
      'Application error',
      'Internal Server Error'
    ]) {
      await expect(body).not.toContainText(invalidText)
    }

    if (publicPage.expectedText) {
      await expect(body).toContainText(publicPage.expectedText)
    }

    expect((await page.title()).trim().length).toBeGreaterThan(0)
  })
}

test('article image preview can be closed and reopened', async ({ page }) => {
  await page.goto('/article/photography-portfolio', {
    waitUntil: 'domcontentloaded'
  })

  const image = page.locator(
    '#notion-article img[alt="notion image"]:visible'
  ).first()
  await image.click({ trial: true })
  await expect(image).toHaveClass(/medium-zoom-image/)

  const expectPreviewClosed = async () => {
    await expect(page.locator('body')).not.toHaveClass(/medium-zoom--opened/)
    await expect(page.locator('.medium-zoom-overlay')).toHaveCount(0)
  }

  const openPreview = async () => {
    const opened = image.evaluate(
      node =>
        new Promise(resolve => {
          node.addEventListener('medium-zoom:opened', () => resolve(), {
            once: true
          })
        })
    )
    await image.click()
    await opened
    await expect(page.locator('body')).toHaveClass(/medium-zoom--opened/)
  }

  await openPreview()
  await page.locator('img.medium-zoom-image--opened').click()
  await expectPreviewClosed()

  await openPreview()
  await page.locator('.medium-zoom-overlay').click({ position: { x: 5, y: 5 } })
  await expectPreviewClosed()

  await openPreview()
  await page.keyboard.press('Escape')
  await expectPreviewClosed()
})
