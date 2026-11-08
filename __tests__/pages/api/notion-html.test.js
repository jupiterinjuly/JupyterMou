import handler, { MAX_HTML_BYTES } from '@/pages/api/notion-html'
import notionAPI from '@/lib/db/notion/getNotionAPI'

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true,
  default: { getBlocks: jest.fn() }
}))

const id = '005f9d8a-dbaa-4d32-8c30-3e66bad88971'
const source = 'attachment:4fb92d7a-76fd-46d0-a891-b103c1e70daa:replay.html'
const block = { id, type: 'embed', properties: { source: [[source]] } }
const html = '<!doctype html><html><script>window.replay=true</script></html>'
const originalFetch = global.fetch

function response({
  type = 'text/html',
  size = '100',
  chunks = [Buffer.from(html)]
} = {}) {
  let i = 0
  return {
    ok: true,
    url: 'https://file.notion.so/replay.html',
    headers: {
      get: key =>
        key === 'content-type' ? type : key === 'content-length' ? size : null
    },
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { value: chunks[i++], done: false }
            : { done: true },
        cancel: jest.fn(),
        releaseLock: jest.fn()
      })
    }
  }
}

async function run(query = { blockId: id }, method = 'GET') {
  const res = { setHeader: jest.fn(), status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  await handler({ method, query }, res)
  return res
}

beforeEach(() => {
  notionAPI.getBlocks.mockResolvedValue({
    recordMap: { block: { [id]: { value: { value: block } } } }
  })
  global.fetch = jest.fn().mockResolvedValue(response())
})

afterEach(() => {
  global.fetch = originalFetch
})

it('returns HTML bytes as JSON without forwarding download headers or cookies', async () => {
  const res = await run()
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({
    html,
    downloadUrl: expect.stringContaining(
      'https://www.notion.so/signed/attachment%3A'
    )
  })
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(`id=${id}`),
    {
      signal: expect.any(AbortSignal),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NotionNext/4.9)' },
      redirect: 'follow'
    }
  )
  expect(res.setHeader).toHaveBeenCalledWith(
    'Cache-Control',
    'private, no-store'
  )
})

it.each([undefined, '../etc/passwd', ['one', 'two'], 'https://example.com'])(
  'rejects invalid IDs before fetching: %s',
  async blockId => {
    const res = await run({ blockId })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(notionAPI.getBlocks).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  }
)

it('only accepts GET', async () => {
  expect((await run({ blockId: id }, 'POST')).status).toHaveBeenCalledWith(405)
})

it('does not proxy arbitrary external embeds', async () => {
  notionAPI.getBlocks.mockResolvedValue({
    recordMap: {
      block: {
        [id]: {
          value: {
            ...block,
            properties: { source: [['https://example.com/replay.html']] }
          }
        }
      }
    }
  })
  expect((await run()).status).toHaveBeenCalledWith(415)
  expect(global.fetch).not.toHaveBeenCalled()
})

it('returns 404 for missing blocks', async () => {
  notionAPI.getBlocks.mockResolvedValue({ recordMap: { block: {} } })
  expect((await run()).status).toHaveBeenCalledWith(404)
})

it('rejects non-HTML responses', async () => {
  global.fetch.mockResolvedValue(response({ type: 'application/pdf' }))
  expect((await run()).status).toHaveBeenCalledWith(415)
})

it('enforces both advertised and streamed size limits', async () => {
  global.fetch.mockResolvedValue(response({ size: String(MAX_HTML_BYTES + 1) }))
  expect((await run()).status).toHaveBeenCalledWith(413)
  global.fetch.mockResolvedValue(
    response({
      size: null,
      chunks: [Buffer.alloc(MAX_HTML_BYTES), Buffer.from('x')]
    })
  )
  expect((await run()).status).toHaveBeenCalledWith(413)
})

it('handles upstream failures without returning a misleading empty frame', async () => {
  global.fetch.mockRejectedValue(new Error('network failure'))
  expect((await run()).status).toHaveBeenCalledWith(502)
})
