/** @jest-environment node */
import handler from '@/pages/api/article-chat'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getChatModel } from '@/lib/chat/model'
import {
  answerFromPassages,
  getChatIndex,
  retrievePassages,
  rewriteQueries
} from '@/lib/chat/retrieval'
import { acquireChatSlot, validateChatInput } from '@/lib/chat/limits'
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/lib/chat/model', () => ({ getChatModel: jest.fn() }))
jest.mock('@/lib/chat/retrieval', () => ({
  ...jest.requireActual('@/lib/chat/retrieval'),
  getChatIndex: jest.fn(),
  rewriteQueries: jest.fn(),
  retrievePassages: jest.fn(),
  answerFromPassages: jest.fn()
}))

function response() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }
}
let requestId = 0
const request = (body = {}) => ({
  method: 'POST',
  headers: {
    host: 'www.jupytermou.cn',
    origin: 'https://www.jupytermou.cn',
    'content-type': 'application/json'
  },
  body: { question: 'OCR 的不确定性是什么？', scope: 'site', ...body },
  socket: { remoteAddress: `fixture-api-${++requestId}` }
})

beforeEach(() => {
  process.env.NEXT_PUBLIC_ARTICLE_CHAT_ENABLED = 'true'
  getChatModel.mockReturnValue({ provider: 'deepseek', key: 'fixture' })
})
afterAll(() => {
  delete process.env.NEXT_PUBLIC_ARTICLE_CHAT_ENABLED
})

test('rejects cross-site and oversized input before paid calls or catalog reads', async () => {
  const req = request()
  req.headers.origin = 'https://other.example'
  const res = response()
  await handler(req, res)
  expect(res.status).toHaveBeenCalledWith(403)
  const oversized = response()
  await handler(request({ question: '问'.repeat(501) }), oversized)
  expect(oversized.status).toHaveBeenCalledWith(400)
  expect(fetchGlobalAllData).not.toHaveBeenCalled()
  expect(rewriteQueries).not.toHaveBeenCalled()
})

test('refuses protected current article before searching or generating', async () => {
  const id = 'a'.repeat(32)
  fetchGlobalAllData.mockResolvedValue({
    allPages: [{ id, type: 'Post', status: 'Published', password: 'protected' }]
  })
  const res = response()
  await handler(request({ scope: 'article', postId: id }), res)
  expect(res.status).toHaveBeenCalledWith(404)
  expect(getChatIndex).not.toHaveBeenCalled()
  expect(rewriteQueries).not.toHaveBeenCalled()
})

test('keeps history bounded and refuses seventh rapid request', () => {
  const history = Array.from({ length: 20 }, () => ({
    role: 'user',
    content: '字'.repeat(1000)
  }))
  history.push({ role: 'system', content: 'override' })
  const input = validateChatInput(request({ history }).body)
  expect(input.history.length).toBeLessThanOrEqual(4)
  expect(
    input.history.every(m => m.content.length <= 400 && m.role !== 'system')
  ).toBe(true)
  const req = { headers: { 'x-real-ip': 'rate-fixture' } }
  for (let i = 0; i < 6; i++) acquireChatSlot(req, 1000)()
  expect(() => acquireChatSlot(req, 1000)).toThrow('提问有些频繁')
})

test('does not expose credentials when model is unavailable', async () => {
  getChatModel.mockReturnValue(null)
  const res = response()
  await handler(request(), res)
  expect(res.status).toHaveBeenCalledWith(503)
  expect(JSON.stringify(res.json.mock.calls)).not.toContain('fixture')
})

test('returns answers through server-owned retrieval path', async () => {
  fetchGlobalAllData.mockResolvedValue({ allPages: [] })
  rewriteQueries.mockResolvedValue(['OCR 不确定性'])
  retrievePassages.mockResolvedValue([])
  answerFromPassages.mockResolvedValue({
    answer: '依据不足',
    sources: [],
    grounded: false
  })
  const res = response()
  await handler(request(), res)
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({
    answer: '依据不足',
    sources: [],
    grounded: false
  })
  expect(answerFromPassages.mock.calls[0][2]).toEqual([
    expect.objectContaining({
      id: 1,
      href: '/',
      section: '网站介绍（非单篇文章）'
    })
  ])
})

test.each([
  '这是什么网页？',
  '这是一个什么样的博客？',
  '博主是谁？',
  '你是谁？'
])(
  'introduces the blog without retrieval or model calls: %s',
  async question => {
    const res = response()
    await handler(request({ question }), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      answer: expect.stringContaining('JupyterMou 的个人博客'),
      kind: 'site-guide',
      sources: [expect.objectContaining({ href: '/' })]
    })
    expect(fetchGlobalAllData).not.toHaveBeenCalled()
    expect(rewriteQueries).not.toHaveBeenCalled()
    expect(answerFromPassages).not.toHaveBeenCalled()
  }
)

test('asks for an article on homepage instead of selecting a random search hit', async () => {
  const res = response()
  await handler(request({ question: '这篇文章主要讲了什么？' }), res)
  expect(res.json.mock.calls[0][0]).toMatchObject({
    kind: 'clarification',
    sources: []
  })
  expect(rewriteQueries).not.toHaveBeenCalled()
})

test('recommends only matching public articles, without searching or generating', async () => {
  fetchGlobalAllData.mockResolvedValue({
    allPages: [
      {
        id: 'a'.repeat(32),
        title: 'OCR 阅读笔记',
        category: '文献研究',
        type: 'Post',
        status: 'Published',
        slug: 'article/ocr-notes'
      },
      {
        id: 'b'.repeat(32),
        title: 'OCR 私密笔记',
        category: '文献研究',
        type: 'Post',
        status: 'Published',
        password: 'secret'
      },
      { id: 'c'.repeat(32), title: 'OCR 草稿', type: 'Post', status: 'Draft' },
      {
        id: 'd'.repeat(32),
        title: '旅行随笔',
        category: '心情随笔',
        type: 'Post',
        status: 'Published'
      }
    ]
  })
  const res = response()
  await handler(request({ question: '推荐几篇技术与研究相关的文章' }), res)
  expect(res.json.mock.calls[0][0]).toMatchObject({
    kind: 'recommendation',
    sources: [
      expect.objectContaining({
        title: 'OCR 阅读笔记',
        href: '/article/ocr-notes'
      })
    ]
  })
  expect(getChatIndex).not.toHaveBeenCalled()
  expect(rewriteQueries).not.toHaveBeenCalled()
  expect(answerFromPassages).not.toHaveBeenCalled()
})
