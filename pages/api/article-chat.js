import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getChatModel } from '@/lib/chat/model'
import {
  guideIntent,
  recommendPosts,
  siteGuideReply,
  SITE_PROFILE
} from '@/lib/chat/siteGuide'
import {
  acquireChatSlot,
  ChatError,
  checkChatOrigin,
  validateChatInput
} from '@/lib/chat/limits'
import {
  answerFromPassages,
  getChatIndex,
  publicCatalog,
  retrievePassages,
  rewriteQueries
} from '@/lib/chat/retrieval'

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '12kb' } }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  const model = getChatModel()
  const enabled =
    process.env.NEXT_PUBLIC_ARTICLE_CHAT_ENABLED === 'true' && !!model
  if (req.method === 'GET') return res.status(200).json({ available: enabled })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!enabled)
    return res.status(503).json({ error: '文章问答暂未开放，请稍后再试。' })
  if (!checkChatOrigin(req))
    return res.status(403).json({ error: '请从本站打开文章问答。' })
  if (!/^application\/json\b/i.test(req.headers['content-type'] || ''))
    return res.status(415).json({ error: '请使用本站的问答窗口。' })
  let release
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)
  const disconnect = () => {
    if (!res.writableEnded) controller.abort()
  }
  res.on('close', disconnect)
  try {
    const input = validateChatInput(req.body)
    release = acquireChatSlot(req)
    const intent = guideIntent(input)
    const guide = siteGuideReply(intent)
    if (guide) return res.status(200).json(guide)
    const data = await fetchGlobalAllData({
      from: 'article-chat',
      requireAvailableData: true
    })
    if (!Array.isArray(data.allPages)) throw new Error('CATALOG_UNAVAILABLE')
    const catalog = publicCatalog(data.allPages)
    const post =
      input.scope === 'article'
        ? catalog.get(input.postId.replace(/-/g, '').toLowerCase())
        : null
    if (input.scope === 'article' && !post)
      throw new ChatError(
        404,
        '这篇文章不在公开问答范围内，请切换到「逛逛整个博客」。'
      )
    const recommendations = recommendPosts(intent, catalog)
    if (recommendations) return res.status(200).json(recommendations)
    const index = getChatIndex()
    const queries = await rewriteQueries(
      model,
      { ...input, post },
      controller.signal
    )
    const passages = await retrievePassages(
      index,
      queries,
      catalog,
      post,
      input.question
    )
    const context =
      input.scope === 'site'
        ? [...passages, { ...SITE_PROFILE, id: passages.length + 1 }]
        : passages
    const answer = await answerFromPassages(
      model,
      { ...input, post },
      context,
      controller.signal
    )
    return res.status(200).json(answer)
  } catch (error) {
    const status = error instanceof ChatError ? error.status : 502
    if (status === 429) res.setHeader('Retry-After', '60')
    if (status >= 500)
      console.warn('[article-chat] request failed', error.code || error.name)
    return res.status(status).json({
      error:
        error instanceof ChatError
          ? error.message
          : '文章问答暂时无法连接，请稍后重试。'
    })
  } finally {
    clearTimeout(timer)
    res.off('close', disconnect)
    release?.()
  }
}
