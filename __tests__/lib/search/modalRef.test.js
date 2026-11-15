import { createSearchModalRef } from '@/lib/search/modalRef'

test('retains an early search click until the dialog loads, without opening twice', async () => {
  const ref = createSearchModalRef()
  ref.openSearch()
  ref.openSearch()
  const openSearch = jest.fn()
  ref.current = { openSearch }
  await Promise.resolve()
  expect(openSearch).toHaveBeenCalledTimes(1)
  ref.openSearch()
  expect(openSearch).toHaveBeenCalledTimes(2)
})

test('waits for the current mounted dialog during a hydration remount', async () => {
  const ref = createSearchModalRef()
  ref.openSearch()
  const old = jest.fn(),
    latest = jest.fn()
  ref.current = { openSearch: old }
  ref.current = null
  ref.current = { openSearch: latest }
  await Promise.resolve()
  expect(old).not.toHaveBeenCalled()
  expect(latest).toHaveBeenCalledTimes(1)
})
