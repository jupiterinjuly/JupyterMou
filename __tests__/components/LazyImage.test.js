import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

jest.mock('@/lib/config', () => ({
  siteConfig: key => {
    if (key === 'IMAGE_COMPRESS_WIDTH') return 1080
    if (key === 'IMG_LAZY_LOAD_PLACEHOLDER') return 'data:image/gif;base64,test'
    if (key === 'LAZY_LOAD_THRESHOLD') return '200px'
    return false
  }
}))

import LazyImage from '@/components/LazyImage'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver

describe('LazyImage Component', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image'
  }

  beforeEach(() => {
    mockIntersectionObserver.mockClear()
  })

  it('renders with required props', () => {
    render(<LazyImage {...defaultProps} />)

    const image = screen.getByAltText('Test image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('applies custom className', () => {
    const customClass = 'custom-image-class'
    render(<LazyImage {...defaultProps} className={customClass} />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveClass(customClass)
  })

  it('sets width and height attributes', () => {
    render(<LazyImage {...defaultProps} width={300} height={200} />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveAttribute('width', '300')
    expect(image).toHaveAttribute('height', '200')
  })

  it('handles priority loading', () => {
    render(<LazyImage {...defaultProps} priority />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveAttribute('loading', 'eager')
  })

  it('uses lazy loading by default', () => {
    render(<LazyImage {...defaultProps} />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<LazyImage {...defaultProps} onClick={handleClick} />)

    const image = screen.getByAltText('Test image')
    image.click()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('sets up IntersectionObserver when not priority', () => {
    render(<LazyImage {...defaultProps} />)

    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  it('does not set up IntersectionObserver for priority images', () => {
    render(<LazyImage {...defaultProps} priority />)

    // Priority images should load immediately without IntersectionObserver
    expect(mockIntersectionObserver).not.toHaveBeenCalled()
  })

  it('handles load event', async () => {
    const handleLoad = jest.fn()
    render(<LazyImage {...defaultProps} onLoad={handleLoad} priority />)

    const image = screen.getByAltText('Test image')

    await waitFor(() => expect(image).toHaveAttribute('src', '/test-image.jpg'))
    fireEvent.load(image)

    await waitFor(() => {
      expect(handleLoad).toHaveBeenCalled()
    })
  })

  it('retries twice before showing a manual retry fallback', () => {
    jest.useFakeTimers()
    render(
      <LazyImage
        {...defaultProps}
        priority
        retryDelayMs={100}
        timeoutMs={9000}
      />
    )

    act(() => jest.advanceTimersByTime(0))
    fireEvent.error(screen.getByAltText('Test image'))

    act(() => jest.advanceTimersByTime(100))
    fireEvent.error(screen.getByAltText('Test image'))

    act(() => jest.advanceTimersByTime(200))
    fireEvent.error(screen.getByAltText('Test image'))

    expect(
      screen.getByRole('button', {
        name: 'Test image加载失败，点击重试'
      })
    ).toBeInTheDocument()

    jest.useRealTimers()
  })

  it('restarts loading when the fallback is clicked', () => {
    jest.useFakeTimers()
    render(
      <LazyImage {...defaultProps} priority retryCount={0} retryDelayMs={100} />
    )

    act(() => jest.advanceTimersByTime(0))
    fireEvent.error(screen.getByAltText('Test image'))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Test image加载失败，点击重试'
      })
    )
    act(() => jest.advanceTimersByTime(0))

    expect(screen.getByAltText('Test image')).toHaveAttribute(
      'src',
      '/test-image.jpg'
    )
    jest.useRealTimers()
  })

  it('treats a request that exceeds nine seconds as failed', () => {
    jest.useFakeTimers()
    render(<LazyImage {...defaultProps} priority retryCount={0} />)

    act(() => jest.advanceTimersByTime(0))
    act(() => jest.advanceTimersByTime(8999))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    act(() => jest.advanceTimersByTime(1))
    expect(
      screen.getByRole('button', {
        name: 'Test image加载失败，点击重试'
      })
    ).toBeInTheDocument()
    jest.useRealTimers()
  })

  it('applies correct decoding attribute', () => {
    render(<LazyImage {...defaultProps} />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveAttribute('decoding', 'async')
  })

  it('handles missing src gracefully', () => {
    render(<LazyImage alt='Test image' />)

    expect(screen.queryByAltText('Test image')).not.toBeInTheDocument()
  })

  it('applies custom styles', () => {
    const customStyle = { border: '1px solid red' }
    render(<LazyImage {...defaultProps} style={customStyle} />)

    const image = screen.getByAltText('Test image')
    expect(image).toHaveStyle('border: 1px solid red')
  })
})
