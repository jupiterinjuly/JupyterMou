/** @jest-environment node */
import {
  buildAlgoliaRecords,
  isSearchablePost
} from '@/lib/search/algoliaRecords'

const post = {
  id: 'post',
  slug: 'article/test',
  title: '中文长文',
  type: 'Post',
  status: 'Published'
}
const map = text => ({
  block: {
    post: {
      value: { id: 'post', type: 'page', content: ['heading', 'paragraph'] }
    },
    heading: {
      value: {
        id: 'a-b',
        type: 'header',
        properties: { title: [['后半部分']] }
      }
    },
    paragraph: { value: { type: 'text', properties: { title: [[text]] } } },
    unrelated: {
      value: { type: 'text', properties: { title: [['不要索引的未引用内容']] } }
    }
  }
})

test('indexes a long Chinese article through its tail within JSON byte limits', () => {
  const text = '中文长文😀。'.repeat(3000) + '结尾独有关键词'
  const records = buildAlgoliaRecords(post, map(text))
  expect(records.length).toBeGreaterThan(5)
  expect(records.every(r => Buffer.byteLength(JSON.stringify(r)) < 9500)).toBe(
    true
  )
  expect(records.map(r => r.content).join('')).toContain('结尾独有关键词')
  expect(records.map(r => r.content).join('')).not.toContain('不要索引')
  expect(records.every(r => r.anchor === 'ab')).toBe(true)
  expect(records.every(r => !r.content.includes('\ufffd'))).toBe(true)
  expect(records[0].objectID).toBe('post')
  expect(records[1].objectID).toBe('post:1')
})

test('excludes private, draft and non-article content', () => {
  for (const overrides of [
    { password: 'protected' },
    { status: 'Draft' },
    { type: 'Page' }
  ]) {
    expect(
      buildAlgoliaRecords({ ...post, ...overrides }, map('secret'))
    ).toEqual([])
    expect(isSearchablePost({ ...post, ...overrides })).toBe(false)
  }
})

test('keeps section boundaries and stable anchors in document order', () => {
  const recordMap = map('第一段')
  recordMap.block.post.value.content.push('heading2', 'last')
  recordMap.block.heading2 = {
    value: {
      id: 'c-d',
      type: 'sub_header',
      properties: { title: [['第二节']] }
    }
  }
  recordMap.block.last = {
    value: { type: 'text', properties: { title: [['文章结尾']] } }
  }
  const records = buildAlgoliaRecords(post, recordMap)
  expect(records.map(r => r.section)).toEqual(['后半部分', '第二节'])
  expect(records[1].anchor).toBe('cd')
  expect(records[1].content).toContain('文章结尾')
})

test('does not walk hidden database rows or executable HTML artifacts', () => {
  const recordMap = map('正文')
  recordMap.block.post.value.content.push('db', 'html')
  recordMap.block.db = {
    value: { type: 'collection_view', content: ['unrelated'] }
  }
  recordMap.block.html = {
    value: { type: 'html', properties: { title: [['执行脚本不索引']] } }
  }
  const content = buildAlgoliaRecords(post, recordMap)
    .map(r => r.content)
    .join('')
  expect(content).not.toContain('不要索引')
  expect(content).not.toContain('执行脚本')
})
