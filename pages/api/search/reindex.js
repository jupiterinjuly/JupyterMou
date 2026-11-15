import { timingSafeEqual } from 'crypto'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'
import { replaceAlgoliaSnapshot } from '@/lib/plugins/algolia'

export const config = { maxDuration: 300 }
let running

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secret = process.env.CRON_SECRET
  const provided = req.headers.authorization
  const expected = `Bearer ${secret}`
  if (
    !secret ||
    typeof provided !== 'string' ||
    Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (running) return res.status(409).json({ error: 'Sync already running' })
  running = (async () => {
    const data = await fetchGlobalAllData({
      from: 'algolia-sync',
      requireAvailableData: true
    })
    if (!Array.isArray(data.allPages)) throw new Error('SOURCE_UNAVAILABLE')
    return replaceAlgoliaSnapshot(data.allPages, post =>
      fetchNotionPageBlocks(post.id, 'algolia-sync', {
        cacheVersion: post.lastEditedDate
      })
    )
  })()
  try {
    return res.status(200).json({ ok: true, ...(await running) })
  } catch (error) {
    console.error('[search] Full sync failed', error.status || error.name)
    return res
      .status(502)
      .json({ error: 'Search index sync failed; retry later' })
  } finally {
    running = null
  }
}
