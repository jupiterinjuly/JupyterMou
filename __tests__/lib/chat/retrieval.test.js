/** @jest-environment node */
import {
  groundedReply,
  NO_EVIDENCE,
  publicCatalog,
  retrievePassages,
  selectPassages
} from '@/lib/chat/retrieval'
import { modelJSON } from '@/lib/chat/model'
import { isNonCanonicalChatPath } from '@/lib/chat/requestPath'

const post = {
  id: 'a'.repeat(32),
  title: 'OCR 原文',
  slug: 'article/ocr',
  type: 'Post',
  status: 'Published'
}
const hit = {
  objectID: post.id,
  postId: post.id,
  content: '文中实验比较了 OCR 不确定性。',
  schemaVersion: 2,
  section: '实验',
  anchor: 'c'.repeat(32)
}

test('only current public posts enter context; URLs use authoritative metadata', () => {
  const catalog = publicCatalog([
    post,
    { ...post, id: 'b'.repeat(32), password: 'protected' },
    { ...post, id: 'd'.repeat(32), status: 'Draft' }
  ])
  const passages = selectPassages(
    [
      {
        hits: [
          hit,
          { ...hit, postId: 'b'.repeat(32) },
          { ...hit, postId: 'd'.repeat(32) }
        ]
      }
    ],
    catalog
  )
  expect(passages).toHaveLength(1)
  expect(passages[0].href).toBe('/article/ocr#' + 'c'.repeat(32))
  expect(selectPassages([{ hits: [hit] }], catalog, 'e'.repeat(32))).toEqual([])
})

test('retrieves multiple chunks despite article distinct and filters before search', async () => {
  const index = { search: jest.fn().mockResolvedValue({ hits: [hit] }) }
  await retrievePassages(
    index,
    ['OCR', '不确定性'],
    publicCatalog([post]),
    post
  )
  expect(index.search).toHaveBeenCalledTimes(1)
  expect(index.search.mock.calls[0][1]).toMatchObject({
    distinct: false,
    hitsPerPage: 200,
    removeWordsIfNoResults: 'none',
    filters: `(postId:"${post.id}")`
  })
})

test('recognizes noncanonical chat paths before URL normalization', () => {
  for (const path of [
    '/zh-CN/api/article-chat',
    '/zh/api/article-chat',
    '/api/%61rticle-chat',
    '/api/article-chat/'
  ]) {
    expect(isNonCanonicalChatPath(`https://www.jupytermou.cn${path}`)).toBe(
      true
    )
  }
  expect(
    isNonCanonicalChatPath('https://www.jupytermou.cn/api/article-chat')
  ).toBe(false)
  expect(isNonCanonicalChatPath('https://www.jupytermou.cn/article/test')).toBe(
    false
  )
})

test('fails closed for fabricated, missing or externally linked citations', () => {
  const passages = selectPassages([{ hits: [hit] }], publicCatalog([post]))
  for (const value of [
    null,
    { supported: true, answer: '没有引用的结论' },
    { supported: true, answer: '结论[9]' },
    { supported: true, answer: '结论[1] https://evil.example' }
  ]) {
    expect(groundedReply(value, passages)).toEqual({
      answer: NO_EVIDENCE,
      sources: [],
      grounded: false
    })
  }
  const reply = groundedReply(
    { supported: true, answer: '实验比较了不确定性[1]。' },
    passages
  )
  expect(reply).toMatchObject({
    grounded: true,
    sources: [{ id: 1, href: '/article/ocr#' + 'c'.repeat(32) }]
  })
  expect(reply.sources[0]).not.toHaveProperty('content')
})

test('prioritizes method bodies over title matches, contents and bare headings', () => {
  const hits = [
    {
      ...hit,
      objectID: 'toc',
      section: '原图与章节定位索引',
      content: '主要方法见第4页。'.repeat(20)
    },
    {
      ...hit,
      objectID: 'heading',
      section: '核心方法',
      content: '核心方法：SPOT。',
      anchor: 'd'.repeat(32)
    },
    {
      ...hit,
      objectID: 'body',
      section: '两阶段流程',
      content: '第一阶段预测结构与中心点，第二阶段解码区域和内容。'.repeat(8),
      anchor: 'e'.repeat(32)
    }
  ]
  const passages = selectPassages(
    [{ hits }],
    publicCatalog([post]),
    null,
    'OCR 的主要方法是什么？'
  )
  expect(passages[0].section).toBe('两阶段流程')
})

test('bounds model output, disables thinking and never retries upstream errors', async () => {
  const saved = global.fetch
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 402 })
  try {
    await expect(
      modelJSON(
        {
          key: 'fixture',
          model: 'deepseek-flash',
          provider: 'deepseek',
          url: 'https://api.deepseek.com/chat/completions'
        },
        [],
        { maxTokens: 180, signal: new AbortController().signal }
      )
    ).rejects.toThrow('MODEL_UNAVAILABLE')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      max_tokens: 180,
      thinking: { type: 'disabled' },
      stream: false
    })
  } finally {
    global.fetch = saved
  }
})
