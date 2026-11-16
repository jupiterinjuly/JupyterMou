import { createHash } from 'crypto'

const requests = new Map()
let inFlight = 0
const MAX_BUCKETS = 2000

export class ChatError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function validateChatInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new ChatError(400, '请输入问题。')
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question || question.length > 500)
    throw new ChatError(400, '每次问题请控制在500字以内。')
  if (!['site', 'article'].includes(body.scope))
    throw new ChatError(400, '请选择问答范围。')
  if (
    body.scope === 'article' &&
    !/^[a-f0-9-]{32,36}$/i.test(body.postId || '')
  )
    throw new ChatError(400, '请先打开一篇公开文章。')
  const history = Array.isArray(body.history)
    ? body.history
        .slice(-4)
        .filter(
          m =>
            m &&
            ['user', 'assistant'].includes(m.role) &&
            typeof m.content === 'string'
        )
        .map(m => ({ role: m.role, content: m.content.slice(0, 400) }))
    : []
  return { question, scope: body.scope, postId: body.postId, history }
}

export function checkChatOrigin(req) {
  const origin = req.headers.origin
  if (typeof origin !== 'string') return false
  try {
    const parsed = new URL(origin)
    const host = req.headers.host
    return (
      parsed.host === host &&
      (parsed.protocol === 'https:' ||
        (process.env.NODE_ENV !== 'production' &&
          ['localhost', '127.0.0.1'].includes(parsed.hostname)))
    )
  } catch {
    return false
  }
}

// Per-instance backstop, NOT a global billing cap. Production also has a
// durable Vercel WAF rule keyed by IP, configured separately before enabling.
export function acquireChatSlot(req, now = Date.now()) {
  for (const [key, value] of requests)
    if (now >= value.expires) requests.delete(key)
  const ip = String(
    req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
  )
  const key = createHash('sha256').update(ip).digest('hex').slice(0, 24)
  const bucket = requests.get(key) || {
    count: 0,
    recent: [],
    expires: now + 3600000
  }
  bucket.recent = bucket.recent.filter(time => time > now - 60000)
  if (bucket.count >= 30 || bucket.recent.length >= 6)
    throw new ChatError(429, '提问有些频繁，请稍后再试。')
  if (inFlight >= 3 || (!requests.has(key) && requests.size >= MAX_BUCKETS))
    throw new ChatError(429, '当前提问人数较多，请稍后再试。')
  bucket.count++
  bucket.recent.push(now)
  requests.set(key, bucket)
  inFlight++
  let released = false
  return () => {
    if (!released) {
      inFlight--
      released = true
    }
  }
}
