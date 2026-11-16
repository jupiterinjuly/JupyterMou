const { test, expect } = require('@playwright/test')

test('actually renders Chinese headings with the original WenKai webfont', async ({
  page
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator('#theme-hexo h2 a').first().waitFor()
  await page.evaluate(() =>
    document.fonts.load(
      '700 24px "LXGW WenKai"',
      '中文精读结构化点提示与视觉文本解析'
    )
  )
  const client = await page.context().newCDPSession(page)
  await client.send('DOM.enable')
  await client.send('CSS.enable')
  const { root } = await client.send('DOM.getDocument')
  const { nodeId } = await client.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '#theme-hexo h2 a'
  })
  const { fonts } = await client.send('CSS.getPlatformFontsForNode', { nodeId })
  expect(
    fonts.some(
      font =>
        font.isCustomFont &&
        /WenKai/i.test(font.familyName) &&
        font.glyphCount > 0
    )
  ).toBe(true)
})
