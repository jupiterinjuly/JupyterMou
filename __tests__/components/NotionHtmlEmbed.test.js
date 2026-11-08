import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import NotionHtmlEmbed from '@/components/NotionHtmlEmbed'

jest.mock('notion-utils', () => ({
  getTextContent: value => (value || []).map(item => item[0]).join('')
}))

const originalFetch = global.fetch

const block = {
  id: '005f9d8a-dbaa-4d32-8c30-3e66bad88971',
  type: 'embed',
  properties: {
    title: [['replay.html']],
    source: [['attachment:4fb92d7a-76fd-46d0-a891-b103c1e70daa:replay.html']],
    caption: [['Recorded trajectories']]
  }
}
const Fallback = () => <div>original renderer</div>

afterEach(() => {
  global.fetch = originalFetch
})

it('preserves the existing renderer for ordinary website embeds', () => {
  global.fetch = jest.fn()
  render(
    <NotionHtmlEmbed
      block={{ ...block, properties: { source: [['https://example.com']] } }}
      fallbackComponent={Fallback}
    />
  )
  expect(screen.getByText('original renderer')).toBeInTheDocument()
  expect(global.fetch).not.toHaveBeenCalled()
})

it('renders HTML in an opaque-origin iframe and preserves its caption', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      html: '<html><head></head><body>replay</body></html>'
    })
  })
  render(<NotionHtmlEmbed block={block} fallbackComponent={Fallback} />)
  const frame = await screen.findByTitle('replay.html')
  expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
  expect(frame).not.toHaveAttribute('src')
  expect(frame.getAttribute('srcdoc')).toContain('Content-Security-Policy')
  expect(screen.getByText('Recorded trajectories')).toBeInTheDocument()
  expect(frame.style.height).toBe('720px')
  fireEvent.click(screen.getByText('展开回放'))
  expect(frame.style.height).toBe('1100px')
})

it('shows an actionable error and allows retry instead of a permanent blank', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: '<p>loaded</p>' })
    })
  render(<NotionHtmlEmbed block={block} fallbackComponent={Fallback} />)
  fireEvent.click(await screen.findByText('重新加载'))
  await screen.findByTitle('replay.html')
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
})

it('expands the replay when the browser denies fullscreen', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ html: '<p>replay</p>' })
  })
  render(<NotionHtmlEmbed block={block} fallbackComponent={Fallback} />)
  const frame = await screen.findByTitle('replay.html')
  frame.requestFullscreen = jest
    .fn()
    .mockRejectedValue(new Error('not granted'))
  fireEvent.click(screen.getByText('全屏查看'))
  await waitFor(() => expect(frame.style.height).toBe('1100px'))
})
