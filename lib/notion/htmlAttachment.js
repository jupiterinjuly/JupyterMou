const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HTML_ATTACHMENT = /^attachment:([0-9a-f-]{36}):[^\r\n]+\.html?$/i

export const isBlockId = value => typeof value === 'string' && UUID.test(value)

export function getHtmlAttachmentSource(block) {
  if (block?.type !== 'embed') return null
  const candidates = [
    block.properties?.source?.[0]?.[0],
    block.format?.display_source
  ]
  return (
    candidates.find(source => {
      if (typeof source !== 'string') return false
      const match = source.match(HTML_ATTACHMENT)
      return match && UUID.test(match[1])
    }) || null
  )
}

export function getHtmlAttachmentDownloadUrl(block) {
  const source = getHtmlAttachmentSource(block)
  if (!source || !isBlockId(block?.id)) return null
  return `https://www.notion.so/signed/${encodeURIComponent(source)}?table=block&id=${block.id}`
}

// srcDoc must never share the blog's origin. The iframe also uses allow-scripts
// without allow-same-origin; this policy keeps self-contained replays offline.
export function createHtmlAttachmentDocument(html) {
  const policy = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    'img-src data: blob: https:',
    'font-src data:',
    'media-src data: blob:',
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'"
  ].join('; ')
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`
  return /<head(?:\s[^>]*)?>/i.test(html)
    ? html.replace(/<head(?:\s[^>]*)?>/i, head => head + meta)
    : meta + html
}
