import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'

export default function getAllPageIds(
  collectionQuery,
  collectionId,
  collectionView,
  viewIds,
  _block = {}
) {
  const pageSet = new Set()
  const targetViewId = viewIds?.[BLOG.NOTION_INDEX || 0]

  // 优先读取所选视图的查询结果，以保留 Notion 视图级筛选和排序。
  const viewQuery = getRecordById(collectionQuery, collectionId)
  let hasQueryData = false
  if (viewQuery) {
    const selectedViewData = getRecordById(viewQuery, targetViewId)
    const queryData = selectedViewData
      ? [selectedViewData]
      : targetViewId
        ? []
        : Object.values(viewQuery)

    hasQueryData = queryData.length > 0
    queryData.forEach(viewData => {
      const collectionGroupBlockIds =
        viewData?.collection_group_results?.blockIds ??
        viewData?.reducerResults?.collection_group_results?.blockIds

      ;[
        collectionGroupBlockIds,
        viewData?.results?.blockIds,
        viewData?.blockIds
      ].forEach(ids => {
        if (Array.isArray(ids) && ids.length > 0) {
          ids.forEach(id => pageSet.add(id))
        }
      })
    })
  }

  // 兼容旧版 Notion 数据格式：查询结果不存在时使用 page_sort。
  if (!hasQueryData) {
    const selectedCollectionView = getRecordById(collectionView, targetViewId)
    const pageSort = selectedCollectionView?.value?.value?.page_sort
    if (Array.isArray(pageSort) && pageSort.length > 0) {
      pageSort.forEach(id => pageSet.add(id))
    }
  }

  return [...pageSet]
}

function getRecordById(record, id) {
  if (!record || !id) return null

  for (const candidate of getIdCandidates(id)) {
    const value = record[candidate]
    if (value) return value
  }

  return null
}

function getIdCandidates(id) {
  const candidates = new Set([id])

  if (typeof id === 'string') {
    candidates.add(id.replace(/-/g, ''))
    candidates.add(toUuid(id))
    try {
      candidates.add(idToUuid(id))
    } catch {
      // notion-utils 无法规范化时继续使用已有候选 ID。
    }
  }

  return [...candidates]
}

function toUuid(id) {
  const compactId = id.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) return id

  return [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20)
  ].join('-')
}
