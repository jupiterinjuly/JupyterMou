const { test, expect } = require('@playwright/test')

test('OCR research records remain visible in all three database views', async ({
  page
}) => {
  await page.goto('/article/financial-ocr-weekly-reports', {
    waitUntil: 'domcontentloaded'
  })
  for (const name of ['分类总览', '按周回顾', '时间顺序']) {
    await page.getByRole('button', { name, exact: true }).click()
    if (name === '按周回顾') {
      const headers = page.locator('.notion-collection-group-title')
      for (const header of await headers.all()) {
        const layout = await header.evaluate(node => ({
          height: node.getBoundingClientRect().height,
          textWidth: node.firstElementChild.getBoundingClientRect().width,
          paddingLeft: parseFloat(getComputedStyle(node).paddingLeft)
        }))
        expect(layout.height).toBeLessThan(110)
        expect(layout.textWidth).toBeGreaterThan(200)
        expect(layout.paddingLeft).toBeLessThanOrEqual(16)
      }
      const header = headers.first()
      await header.click()
      expect(await header.evaluate(node => node.parentElement.open)).toBe(false)
      await header.click()
      expect(await header.evaluate(node => node.parentElement.open)).toBe(true)
      await expect(
        page
          .locator('.notion-collection-group-title')
          .filter({ hasText: '2026.11.' })
          .first()
      ).toBeVisible()
    }
    await expect(
      page
        .locator('#notion-article .notion-table-row')
        .filter({ hasText: 'OmniParser V2' })
        .first()
    ).toBeVisible()
    await expect(
      page
        .locator('#notion-article .notion-table-row')
        .filter({ hasText: 'PAR｜位置扰动' })
        .first()
    ).toBeVisible()
  }
})
