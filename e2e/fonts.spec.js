const { test, expect } = require('@playwright/test')

test('actually renders Chinese headings with the original WenKai webfont', async ({
  page
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator('#theme-hexo h2 a').first().waitFor()
  // fonts.load resolves with [] if the stylesheet hasn't registered its faces.
  // Wait for the face definitions before checking real rendered glyphs.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.fonts].some(face => /LXGW WenKai/.test(face.family))
        ),
      { timeout: 30000 }
    )
    .toBe(true)
  await page.evaluate(async () => {
    await document.fonts.load(
      '700 24px "LXGW WenKai"',
      document.querySelector('#theme-hexo h2 a').textContent
    )
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    )
  })
  const client = await page.context().newCDPSession(page)
  await client.send('DOM.enable')
  await client.send('CSS.enable')
  const { root } = await client.send('DOM.getDocument')
  const { nodeId } = await client.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '#theme-hexo h2 a'
  })
  await expect
    .poll(
      async () => {
        const { fonts } = await client.send('CSS.getPlatformFontsForNode', {
          nodeId
        })
        return fonts.some(
          font =>
            font.isCustomFont &&
            /WenKai/i.test(font.familyName) &&
            font.glyphCount > 0
        )
      },
      { timeout: 15000 }
    )
    .toBe(true)
})
