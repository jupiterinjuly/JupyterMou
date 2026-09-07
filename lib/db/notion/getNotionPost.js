import BLOG from '@/blog.config'
import { getTextContent, idToUuid } from 'notion-utils'
import ReactNotionX from 'react-notion-x'
import formatDate from '../../utils/formatDate'
import { fetchNotionPageBlocks, formatNotionBlock } from './getPostBlocks'
import { checkStrIsNotionId, checkStrIsUuid } from '@/lib/utils'
import { adapterNotionBlockMap } from '@/lib/utils/notion.util'
import { normalizePageBlock } from './normalizeUtil'

/**
 * 根据页面ID获取文章
 * @param {*} pageId
 * @returns
 */
export async function fetchPageFromNotion(pageId) {
  const rawBlockMap = await fetchNotionPageBlocks(pageId, 'slug')
  if (!rawBlockMap) {
    return null
  }
  if (checkStrIsNotionId(pageId)) {
    pageId = idToUuid(pageId)
  }
  if (!checkStrIsUuid(pageId)) {
    return null
  }
  // Notion API 7.12.x may wrap page records as
  // { value: { value: page, role }, role }. Normalize both the record map used
  // by react-notion-x and the root page metadata consumed below.
  const blockMap = adapterNotionBlockMap(rawBlockMap)
  blockMap.block = formatNotionBlock(blockMap.block)
  const postInfo = normalizePageBlock(blockMap?.block?.[pageId])
  if (!postInfo) {
    return null
  }

  const createdTimestamp = getValidTimestamp(postInfo.created_time)
  const lastEditedTimestamp = getValidTimestamp(
    postInfo.last_edited_time,
    postInfo.created_time
  )
  const publishDay = formatTimestamp(createdTimestamp)
  const lastEditedDay = formatTimestamp(lastEditedTimestamp)
  const pageCover = getPageCover(postInfo) || BLOG.HOME_BANNER_IMAGE || null

  return {
    id: pageId,
    type: 'Page',
    category: '',
    tags: [],
    title: getTextContent(postInfo?.properties?.title || []) || null,
    status: 'Published',
    createdTime: publishDay,
    publishDate: createdTimestamp,
    publishDay,
    lastEditedDate: lastEditedTimestamp,
    lastEditedDay,
    fullWidth: postInfo?.format?.page_full_width ?? false,
    pageCover,
    page_cover: pageCover,
    date: {
      start_date: publishDay
    },
    blockMap
  }
}

function getValidTimestamp(...values) {
  for (const value of values) {
    const timestamp = new Date(value).getTime()
    if (!Number.isNaN(timestamp)) return timestamp
  }
  return null
}

function formatTimestamp(timestamp) {
  return timestamp ? formatDate(timestamp, BLOG.LANG) : ''
}

function getPageCover(postInfo) {
  const pageCover = postInfo.format?.page_cover
  if (pageCover) {
    if (pageCover.startsWith('/')) return BLOG.NOTION_HOST + pageCover
    if (pageCover.startsWith('http')) {
      console.log('ReactNotionX', ReactNotionX)
      return pageCover
    }
    // return defaultMapImageUrl(pageCover, postInfo)
    return null
  }
}
