import { useEffect, useRef, useState } from 'react'
import { getTextContent } from 'notion-utils'
import {
  createHtmlAttachmentDocument,
  getHtmlAttachmentDownloadUrl,
  getHtmlAttachmentSource
} from '@/lib/notion/htmlAttachment'

export default function NotionHtmlEmbed({
  fallbackComponent: Fallback,
  ...props
}) {
  const { block } = props
  const isHtmlAttachment = Boolean(getHtmlAttachmentSource(block))
  if (!isHtmlAttachment) return <Fallback {...props} />
  return <HtmlAttachment block={block} />
}

function HtmlAttachment({ block }) {
  const frameRef = useRef(null)
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const title = getTextContent(block.properties?.title) || 'HTML 交互内容'
  const caption = getTextContent(block.properties?.caption)
  const downloadUrl = getHtmlAttachmentDownloadUrl(block)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setHtml(null)
    setError(false)
    const timeout = setTimeout(() => controller.abort(), 15000)
    fetch(`/api/notion-html?blockId=${encodeURIComponent(block.id)}`, {
      signal: controller.signal
    })
      .then(async response => {
        if (!response.ok) throw new Error('Attachment unavailable')
        const result = await response.json()
        if (typeof result.html !== 'string' || !result.html.trim()) {
          throw new Error('Empty attachment')
        }
        if (active) setHtml(createHtmlAttachmentDocument(result.html))
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => clearTimeout(timeout))
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [block.id, attempt])

  return (
    <figure className='notion-html-embed my-4 w-full'>
      <div className='mb-2 flex flex-wrap items-center gap-3 text-sm'>
        <span className='break-all'>{title}</span>
        {html && (
          <>
            <button
              type='button'
              onClick={() => frameRef.current?.requestFullscreen?.()}
              className='underline'
            >
              全屏查看
            </button>
            <button
              type='button'
              onClick={() => setExpanded(value => !value)}
              className='underline'
            >
              {expanded ? '收起回放' : '展开回放'}
            </button>
          </>
        )}
        <a
          href={downloadUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='underline'
        >
          下载 HTML
        </a>
      </div>
      {html ? (
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={html}
          sandbox='allow-scripts'
          referrerPolicy='no-referrer'
          allowFullScreen
          style={{ width: '100%', height: expanded ? 1100 : 720, border: 0 }}
        />
      ) : (
        <div role='status' className='rounded border p-5'>
          {error ? (
            <>
              <p>交互内容暂时无法加载，可下载 HTML 后用浏览器打开。</p>
              <button
                type='button'
                className='underline'
                onClick={() => setAttempt(value => value + 1)}
              >
                重新加载
              </button>
            </>
          ) : (
            '正在加载交互内容…'
          )}
        </div>
      )}
      {caption && (
        <figcaption className='mt-2 text-center text-sm opacity-70'>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
