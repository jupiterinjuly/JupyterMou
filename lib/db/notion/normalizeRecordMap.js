const COLLECTION_VIEW_TYPES = new Set(['collection_view', 'collection_view_page'])

const unwrapRecordValue = item => {
  if (!item) return null

  let current = item
  for (let i = 0; i < 6; i++) {
    if (!current) return null
    if (current.id || current.type || current.schema) return current
    if (current.value) {
      current = current.value
      continue
    }
    break
  }

  return current?.id || current?.type || current?.schema ? current : null
}

const normalizeRecordGroup = records => {
  if (!records) return records

  return Object.fromEntries(
    Object.entries(records)
      .map(([id, item]) => {
        const value = unwrapRecordValue(item?.value || item)
        if (!value) return null

        return [
          id,
          {
            ...item,
            role: item.role || item?.value?.role,
            value
          }
        ]
      })
      .filter(Boolean)
  )
}

const getQueryBlockIds = (collectionQuery, collectionId, viewId) => {
  const viewQuery = collectionQuery?.[collectionId]?.[viewId]
  return (
    viewQuery?.collection_group_results?.blockIds ||
    viewQuery?.reducerResults?.collection_group_results?.blockIds ||
    []
  )
}

const getTitleProperty = collection => {
  const schema = collection?.value?.schema || collection?.schema || {}
  const titleProperty = Object.entries(schema).find(([, value]) => {
    return value?.type === 'title'
  })
  return titleProperty?.[0] || 'title'
}

const createFallbackGalleryView = ({
  viewId,
  collectionId,
  collection,
  collectionQuery,
  block
}) => {
  const titleProperty = getTitleProperty(collection)

  return {
    value: {
      id: viewId,
      type: 'gallery',
      name: 'Gallery',
      format: {
        gallery_cover: {
          type: 'page_content'
        },
        gallery_cover_aspect: 'cover',
        gallery_properties: [
          {
            property: titleProperty,
            visible: true
          }
        ],
        collection_pointer: block?.format?.collection_pointer || {
          id: collectionId,
          table: 'collection'
        }
      },
      page_sort: getQueryBlockIds(collectionQuery, collectionId, viewId)
    }
  }
}

const ensureEmbeddedCollectionViews = recordMap => {
  if (!recordMap?.block) return recordMap

  const collectionView = { ...(recordMap.collection_view || {}) }

  Object.values(recordMap.block).forEach(item => {
    const block = item?.value
    if (!COLLECTION_VIEW_TYPES.has(block?.type)) return

    const collectionId = block.collection_id
    if (!collectionId) return

    block.view_ids?.forEach(viewId => {
      if (collectionView[viewId]) return

      collectionView[viewId] = createFallbackGalleryView({
        viewId,
        collectionId,
        collection: recordMap.collection?.[collectionId],
        collectionQuery: recordMap.collection_query,
        block
      })
    })
  })

  return { ...recordMap, collection_view: collectionView }
}

/**
 * react-notion-x expects record groups in the classic `{ id: { value } }`
 * shape. Newer Notion payloads can add one or more nested `value` wrappers.
 */
export const normalizeRecordMap = recordMap => {
  if (!recordMap?.block) return recordMap

  const normalized = {
    ...recordMap,
    block: normalizeRecordGroup(recordMap.block),
    collection: normalizeRecordGroup(recordMap.collection),
    collection_view: normalizeRecordGroup(recordMap.collection_view)
  }

  return ensureEmbeddedCollectionViews(normalized)
}

