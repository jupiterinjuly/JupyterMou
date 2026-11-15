/** @jest-environment node */
import handler from '@/pages/api/search/reindex'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
jest.mock('@/lib/db/SiteDataApi', () => ({ fetchGlobalAllData: jest.fn() }))
jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn()
}))
jest.mock('@/lib/plugins/algolia', () => ({
  replaceAlgoliaSnapshot: jest.fn()
}))
test('rejects missing and incorrect sync credentials before reading Notion', async () => {
  process.env.CRON_SECRET = 'fixture-secret'
  for (const authorization of [undefined, 'Bearer wrong']) {
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    await handler({ method: 'POST', headers: { authorization } }, res)
    expect(res.status).toHaveBeenCalledWith(401)
  }
  expect(fetchGlobalAllData).not.toHaveBeenCalled()
  delete process.env.CRON_SECRET
})
