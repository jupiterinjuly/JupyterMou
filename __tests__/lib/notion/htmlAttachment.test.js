import {
  createHtmlAttachmentDocument,
  getHtmlAttachmentDownloadUrl,
  getHtmlAttachmentSource
} from '@/lib/notion/htmlAttachment'

const block = {
  id: '005f9d8a-dbaa-4d32-8c30-3e66bad88971',
  type: 'embed',
  properties: {
    source: [['attachment:4fb92d7a-76fd-46d0-a891-b103c1e70daa:replay.html']]
  }
}

describe('HTML attachment detection and isolation', () => {
  it('resolves native HTML attachments to the Notion signed endpoint', () => {
    expect(getHtmlAttachmentSource(block)).toBe(block.properties.source[0][0])
    const url = new URL(getHtmlAttachmentDownloadUrl(block))
    expect(url.origin).toBe('https://www.notion.so')
    expect(url.searchParams.get('id')).toBe(block.id)
  })

  it('also recognizes display_source-only embeds', () => {
    expect(
      getHtmlAttachmentSource({
        ...block,
        properties: {},
        format: { display_source: block.properties.source[0][0] }
      })
    ).toBeTruthy()
  })

  it.each([
    'https://example.com/replay.html',
    'javascript:alert(1)',
    'attachment:bad-id:replay.html',
    'attachment:4fb92d7a-76fd-46d0-a891-b103c1e70daa:file.pdf'
  ])('does not intercept other embeds or invalid sources: %s', source => {
    expect(
      getHtmlAttachmentSource({ ...block, properties: { source: [[source]] } })
    ).toBeNull()
  })

  it('rejects non-embed blocks and invalid block IDs', () => {
    expect(getHtmlAttachmentSource({ ...block, type: 'file' })).toBeNull()
    expect(
      getHtmlAttachmentDownloadUrl({ ...block, id: '../private' })
    ).toBeNull()
  })

  it('inserts the offline policy before scripts while retaining the replay', () => {
    const document = createHtmlAttachmentDocument(
      '<!doctype html><html><head><script>window.play()</script></head><body>replay</body></html>'
    )
    expect(document.indexOf('Content-Security-Policy')).toBeLessThan(
      document.indexOf('<script>')
    )
    expect(document).toContain("connect-src 'none'")
    expect(document).toContain("script-src 'unsafe-inline'")
    expect(document).toContain('<body>replay</body>')
    expect(createHtmlAttachmentDocument('<p>fragment</p>')).toContain(
      '<p>fragment</p>'
    )
  })
})
