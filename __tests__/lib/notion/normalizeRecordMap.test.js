import { normalizeRecordMap } from '@/lib/db/notion/normalizeRecordMap'

describe('normalizeRecordMap', () => {
  it('adds a fallback gallery view for embedded collections missing view metadata', () => {
    const recordMap = {
      block: {
        page: {
          value: {
            id: 'page',
            type: 'page',
            content: ['collection-block']
          }
        },
        'collection-block': {
          value: {
            id: 'collection-block',
            type: 'collection_view',
            collection_id: 'collection-id',
            view_ids: ['missing-view-id'],
            format: {
              collection_pointer: {
                id: 'collection-id',
                table: 'collection',
                spaceId: 'space-id'
              }
            }
          }
        }
      },
      collection: {
        'collection-id': {
          value: {
            value: {
              id: 'collection-id',
              schema: {
                title: {
                  name: '名称',
                  type: 'title'
                }
              }
            }
          }
        }
      },
      collection_view: {},
      collection_query: {
        'collection-id': {
          'missing-view-id': {
            collection_group_results: {
              blockIds: ['row-1', 'row-2']
            }
          }
        }
      }
    }

    const normalized = normalizeRecordMap(recordMap)

    expect(normalized.collection['collection-id'].value.schema.title.type).toBe(
      'title'
    )
    expect(normalized.collection_view['missing-view-id']).toEqual({
      value: expect.objectContaining({
        id: 'missing-view-id',
        type: 'gallery',
        page_sort: ['row-1', 'row-2'],
        format: expect.objectContaining({
          gallery_cover: { type: 'page_content' },
          gallery_properties: [{ property: 'title', visible: true }],
          collection_pointer: {
            id: 'collection-id',
            table: 'collection',
            spaceId: 'space-id'
          }
        })
      })
    })
  })

  it('unwraps nested collection view values returned by newer Notion payloads', () => {
    const recordMap = {
      block: {
        page: {
          value: {
            id: 'page',
            type: 'page'
          }
        }
      },
      collection_view: {
        'view-id': {
          spaceId: 'space-id',
          value: {
            value: {
              id: 'view-id',
              type: 'gallery',
              name: '画廊视图'
            }
          }
        }
      }
    }

    const normalized = normalizeRecordMap(recordMap)

    expect(normalized.collection_view['view-id'].value).toEqual({
      id: 'view-id',
      type: 'gallery',
      name: '画廊视图'
    })
  })
})

