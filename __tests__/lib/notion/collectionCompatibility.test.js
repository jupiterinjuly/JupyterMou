import { filterCollectionViewData } from '@/lib/db/notion/filterCollectionViewData'

const makeMap = () => ({
  block: {
    'week-id': { value: { properties: { title: [['Week 1']] } } },
    row: {
      value: {
        properties: {
          category: [['Reading']],
          week: [['‣', [['p', 'week-id']]]]
        }
      }
    }
  },
  collection: {
    db: {
      value: {
        schema: { category: { type: 'select' }, week: { type: 'relation' } }
      }
    }
  },
  collection_view: {
    timeline: {
      value: {
        id: 'timeline',
        type: 'table',
        format: {
          collection_pointer: { id: 'db' },
          property_filters: [
            {
              filter: {
                property: 'category',
                filter: { operator: 'enum_is', value: { type: 'exact' } }
              }
            }
          ]
        }
      }
    },
    grouped: {
      value: {
        id: 'grouped',
        type: 'table',
        format: {
          collection_pointer: { id: 'db' },
          collection_group_by: { property: 'category', type: 'select' }
        }
      }
    },
    weekly: {
      value: {
        id: 'weekly',
        type: 'table',
        format: {
          collection_pointer: { id: 'db' },
          collection_group_by: { property: 'week', type: 'relation' }
        }
      }
    }
  },
  collection_query: {
    db: {
      timeline: { collection_group_results: { blockIds: ['row'] } },
      grouped: {
        table_groups: {
          results: [
            { value: { type: 'select', value: 'Reading' }, visible: true }
          ]
        }
      },
      weekly: {
        table_groups: {
          results: [
            {
              value: { type: 'relation', value: { id: 'week-id' } },
              visible: true
            }
          ]
        }
      }
    }
  }
})

test('incomplete Notion filter controls do not remove table records', () => {
  const map = makeMap()
  filterCollectionViewData(map)
  expect(
    map.collection_query.db.timeline.collection_group_results.blockIds
  ).toEqual(['row'])
})

test('new group metadata renders category and relation groups using returned rows', () => {
  const map = makeMap()
  filterCollectionViewData(map)
  expect(
    map.collection_view.grouped.value.format.collection_groups
  ).toHaveLength(1)
  expect(
    map.collection_query.db.grouped['results:select:Reading'].blockIds
  ).toEqual(['row'])
  expect(
    map.collection_query.db.weekly['results:relation:Week 1'].blockIds
  ).toEqual(['row'])
  expect(
    map.collection_view.weekly.value.format.collection_groups[0].value.value
  ).toBe('Week 1')
})

test('completed filters still exclude nonmatching records from synthesized groups', () => {
  const map = makeMap()
  map.collection_view.grouped.value.query2 = {
    filter: {
      property: 'category',
      filter: { operator: 'enum_is', value: { type: 'exact', value: 'Other' } }
    }
  }
  filterCollectionViewData(map)
  expect(
    map.collection_query.db.grouped['results:select:Reading'].blockIds
  ).toEqual([])
})
