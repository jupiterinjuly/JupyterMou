import notionAPI from '@/lib/db/notion/getNotionAPI'
import { normalizePageBlock } from '@/lib/db/notion/normalizeUtil'
import {
  getHtmlAttachmentDownloadUrl,
  isBlockId
} from '@/lib/notion/htmlAttachment'

export const MAX_HTML_BYTES = 2 * 1024 * 1024

async function readLimitedHtml(response) {
  if (Number(response.headers.get('content-length')) > MAX_HTML_BYTES) {
    throw new Error('too-large')
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('empty-body')
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_HTML_BYTES) {
        await reader.cancel()
        throw new Error('too-large')
      }
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const blockId = req.query.blockId
  if (!isBlockId(blockId)) {
    return res.status(400).json({ error: 'Invalid block ID' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const pageChunk = await notionAPI.getBlocks([blockId])
    const block = normalizePageBlock(pageChunk?.recordMap?.block?.[blockId])
    if (!block) return res.status(404).json({ error: 'Attachment not found' })
    // Resolve from Notion's block, never from a caller-provided remote URL.
    const downloadUrl = getHtmlAttachmentDownloadUrl(block)
    if (!downloadUrl) {
      return res.status(415).json({ error: 'Not an HTML attachment embed' })
    }
    // No Notion auth cookies are forwarded. Notion's signed endpoint must allow
    // the attachment to be downloaded publicly before we can return its bytes.
    const response = await fetch(downloadUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NotionNext/4.9)' },
      redirect: 'follow'
    })
    const host = new URL(response.url).hostname
    if (
      !response.ok ||
      (host !== 'file.notion.so' && host !== 'www.notion.so')
    ) {
      return res.status(502).json({ error: 'Attachment download unavailable' })
    }
    const contentType = response.headers.get('content-type') || ''
    if (!/^text\/html\b|^application\/xhtml\+xml\b/i.test(contentType)) {
      return res.status(415).json({ error: 'Attachment is not HTML' })
    }
    const html = await readLimitedHtml(response)
    return res.status(200).json({ html, downloadUrl })
  } catch (error) {
    if (error.message === 'too-large') {
      return res.status(413).json({ error: 'HTML attachment exceeds 2 MB' })
    }
    return res.status(502).json({ error: 'Unable to load HTML attachment' })
  } finally {
    clearTimeout(timeout)
  }
}
