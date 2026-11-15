/** @jest-environment node */
import {
  uploadDataToAlgolia,
  replaceAlgoliaSnapshot
} from '@/lib/plugins/algolia'
const mockGet = jest.fn()
const mockSave = jest.fn()
const mockDelete = jest.fn()
const mockSettings = jest.fn()
const mockReplace = jest.fn()
jest.mock('@/blog.config', () => ({
  ALGOLIA_APP_ID: 'fixture',
  ALGOLIA_INDEX: 'fixture',
  ALGOLIA_ADMIN_APP_KEY: 'fixture'
}))
jest.mock('algoliasearch', () => () => ({
  initIndex: () => ({
    getObject: (...args) => mockGet(...args),
    saveObjects: (...args) => mockSave(...args),
    deleteObjects: (...args) => mockDelete(...args),
    setSettings: (...args) => mockSettings(...args),
    replaceAllObjects: (...args) => mockReplace(...args)
  })
}))
const map = {
  block: {
    p: { value: { type: 'page', content: ['text'] } },
    text: { value: { type: 'text', properties: { title: [['内容']] } } }
  }
}
const post = {
  id: 'p',
  title: '文章',
  type: 'Post',
  status: 'Published',
  blockMap: map
}
beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockRejectedValue({ status: 404 })
  for (const mock of [mockSave, mockDelete, mockSettings, mockReplace])
    mock.mockImplementation(() => ({ wait: async () => ({}) }))
})
test('does not replace newer indexed text with an older cached article', async () => {
  mockGet.mockResolvedValue({ lastEditedDate: '2026-11-15T12:00:00Z' })
  await uploadDataToAlgolia({ ...post, lastEditedDate: '2026-11-14T12:00:00Z' })
  expect(mockSave).not.toHaveBeenCalled()
})

test('removes obsolete chunks when an article gets shorter', async () => {
  mockGet.mockResolvedValue({
    chunkCount: 5,
    contentHash: 'old',
    schemaVersion: 2
  })
  await uploadDataToAlgolia(post)
  expect(mockSave).toHaveBeenCalledTimes(1)
  expect(mockDelete).toHaveBeenCalledWith(['p:1', 'p:2', 'p:3', 'p:4'])
})
test('does not replace live records when any article cannot be fetched', async () => {
  await expect(
    replaceAlgoliaSnapshot([post], async () => {
      throw Error('offline')
    })
  ).rejects.toThrow('offline')
  expect(mockReplace).not.toHaveBeenCalled()
  expect(mockSettings).not.toHaveBeenCalled()
})
test('atomically replaces the complete public snapshot without private posts', async () => {
  const load = jest.fn().mockResolvedValue(map)
  expect(
    await replaceAlgoliaSnapshot(
      [post, { ...post, id: 'secret', password: 'protected' }],
      load
    )
  ).toEqual({ articles: 1, records: 1 })
  expect(load).toHaveBeenCalledTimes(1)
  expect(mockReplace).toHaveBeenCalledWith(
    [expect.objectContaining({ postId: 'p' })],
    { safe: true }
  )
})
