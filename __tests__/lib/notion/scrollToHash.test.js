import { stabilizeArticleHash } from '@/lib/notion/scrollToHash'

test('realigns a heading after layout shifts and stops when the reader scrolls', () => {
  jest.useFakeTimers()
  let resize
  const previous = global.ResizeObserver
  global.ResizeObserver = class {
    constructor(cb) {
      resize = cb
    }
    observe() {}
    disconnect() {}
  }
  const raf = jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation(cb => setTimeout(cb, 0))
  const cancel = jest
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(clearTimeout)
  const scroll = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const root = document.createElement('article')
  root.innerHTML =
    '<h2><div id="target" class="notion-header-anchor"></div>章节</h2>'
  document.body.append(root)
  window.location.hash = 'target'
  let top = 1000
  root.firstElementChild.getBoundingClientRect = () => ({ top })
  const stop = stabilizeArticleHash(root)
  jest.advanceTimersByTime(1)
  expect(scroll).toHaveBeenLastCalledWith({ top: 904, behavior: 'auto' })
  top = 1300
  resize()
  jest.advanceTimersByTime(1)
  expect(scroll).toHaveBeenLastCalledWith({ top: 1204, behavior: 'auto' })
  window.dispatchEvent(new Event('wheel'))
  resize()
  jest.advanceTimersByTime(1)
  expect(scroll).toHaveBeenCalledTimes(2)
  stop()
  root.remove()
  window.location.hash = ''
  raf.mockRestore()
  cancel.mockRestore()
  scroll.mockRestore()
  global.ResizeObserver = previous
  jest.useRealTimers()
})
