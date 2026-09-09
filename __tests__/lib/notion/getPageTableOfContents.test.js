import { getPageTableOfContents } from '@/lib/db/notion/getPageTableOfContents'

describe('getPageTableOfContents', () => {
  it('supports modern Notion heading block types', () => {
    const page = {
      content: ['heading-1', 'heading-2']
    }
    const recordMap = {
      block: {
        'heading-1': {
          value: {
            type: 'heading_1',
            properties: { title: [['About']] }
          }
        },
        'heading-2': {
          value: {
            type: 'heading_2',
            properties: { title: [['Work']] }
          }
        }
      }
    }

    expect(getPageTableOfContents(page, recordMap)).toEqual([
      {
        id: 'heading-1',
        type: 'heading_1',
        text: 'About',
        indentLevel: 0
      },
      {
        id: 'heading-2',
        type: 'heading_2',
        text: 'Work',
        indentLevel: 1
      }
    ])
  })

  it('ignores header-like blocks without a known indent level', () => {
    const page = {
      content: ['bad-heading']
    }
    const recordMap = {
      block: {
        'bad-heading': {
          value: {
            type: 'unknown_header',
            properties: { title: [['Unsupported']] }
          }
        }
      }
    }

    expect(getPageTableOfContents(page, recordMap)).toEqual([])
  })
})
