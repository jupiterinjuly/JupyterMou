import BLOG from '@/blog.config'
import algoliasearch from 'algoliasearch'
import { sha256 } from 'js-sha256'
import {
  buildAlgoliaRecords,
  isSearchablePost,
  SEARCH_SCHEMA_VERSION
} from '@/lib/search/algoliaRecords'

let indexes
function getIndexes() {
  if (indexes) return indexes
  const appId = String(
    BLOG.ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID || ''
  ).trim()
  const name = String(
    BLOG.ALGOLIA_INDEX || process.env.ALGOLIA_INDEX || ''
  ).trim()
  const writeKey = String(BLOG.ALGOLIA_ADMIN_APP_KEY || '').trim()
  const readKey =
    BLOG.ALGOLIA_SEARCH_ONLY_APP_KEY ||
    process.env.ALGOLIA_SEARCH_ONLY_APP_KEY ||
    writeKey
  if (!appId || !name || !writeKey) return null
  const client = algoliasearch(appId, writeKey)
  indexes = {
    client,
    write: client.initIndex(name),
    read: algoliasearch(appId, readKey).initIndex(name)
  }
  return indexes
}

export const ALGOLIA_SETTINGS = {
  searchableAttributes: [
    'title',
    'section',
    'tags',
    'category',
    'content',
    'summary'
  ],
  attributesForFaceting: ['filterOnly(postId)', 'category', 'tags'],
  attributeForDistinct: 'postId',
  distinct: true,
  attributesToSnippet: ['content:40'],
  attributesToHighlight: [],
  indexLanguages: ['zh', 'en'],
  queryLanguages: ['zh', 'en']
}

async function existingPost(index, id) {
  try {
    return await index.getObject(id)
  } catch (error) {
    if (error.status === 404 || error.statusCode === 404) return null
    throw error
  }
}

const chunkIds = (id, count) =>
  Array.from(
    { length: Math.min(Math.max(Number(count) || 1, 1), 10000) },
    (_, i) => (i ? `${id}:${i}` : id)
  )

function recordsForPost(post, blockMap) {
  const records = buildAlgoliaRecords(post, blockMap)
  const contentHash = sha256(JSON.stringify(records))
  if (records[0])
    Object.assign(records[0], { chunkCount: records.length, contentHash })
  return records
}

export async function uploadDataToAlgolia(post) {
  if (!isSearchablePost(post) || !post.blockMap?.block) return
  const index = getIndexes()
  if (!index) return
  const records = recordsForPost(post, post.blockMap)
  const old = await existingPost(index.read, post.id)
  if (Date.parse(old?.lastEditedDate) > Date.parse(post.lastEditedDate)) return
  if (
    old?.schemaVersion === SEARCH_SCHEMA_VERSION &&
    old?.contentHash === records[0]?.contentHash
  )
    return
  if (records.length) await index.write.saveObjects(records).wait()
  const stale = chunkIds(post.id, old?.chunkCount).slice(records.length)
  if (old && stale.length) await index.write.deleteObjects(stale).wait()
}

// Complete source reads before atomically replacing the current snapshot.
export async function replaceAlgoliaSnapshot(posts, loadBlocks) {
  const index = getIndexes()
  if (!index) throw new Error('ALGOLIA_NOT_CONFIGURED')
  const publicPosts = posts.filter(isSearchablePost)
  const records = []
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(3, publicPosts.length) }, async () => {
      while (cursor < publicPosts.length) {
        const post = publicPosts[cursor++]
        const blockMap = await loadBlocks(post)
        if (!blockMap?.block || !Object.keys(blockMap.block).length)
          throw new Error('ARTICLE_CONTENT_UNAVAILABLE')
        records.push(...recordsForPost(post, blockMap))
      }
    })
  )
  await index.write.setSettings(ALGOLIA_SETTINGS).wait()
  await index.write.replaceAllObjects(records, { safe: true }).wait()
  return { articles: publicPosts.length, records: records.length }
}

export async function checkDataFromAlgolia({ allPages }) {
  const index = getIndexes()
  if (!index || !Array.isArray(allPages)) return
  for (const post of allPages.filter(post => !isSearchablePost(post))) {
    try {
      const old = await existingPost(index.read, post.id)
      if (old)
        await index.write
          .deleteObjects(chunkIds(post.id, old.chunkCount))
          .wait()
    } catch (error) {
      console.warn('[search] Removal failed', error.status || error.name)
    }
  }
}

export async function generateAlgoliaSearch({ allPages }) {
  for (const post of allPages || []) await uploadDataToAlgolia(post)
}
