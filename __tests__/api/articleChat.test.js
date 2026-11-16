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
const request = (body = {}) => ({
  method: 'POST',
  headers: {
    host: 'www.jupytermou.cn',
    origin: 'https://www.jupytermou.cn',
    'content-type': 'application/json'
  },
  body: { question: 'OCR 的不确定性是什么？', scope: 'site', ...body },
  socket: { remoteAddress: 'fixture-api' }
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
})
