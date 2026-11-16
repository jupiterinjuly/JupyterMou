import { useEffect, useRef, useState } from 'react'
import styles from './ArticleChat.module.css'

function Answer({ message }) {
  const sources = new Map(
    (message.sources || []).map(source => [source.id, source])
  )
  return (
    <>
      <p className={styles.answer}>
        {message.content.split(/(\[\d+\])/g).map((part, i) => {
          const source = sources.get(Number(part.match(/^\[(\d+)\]$/)?.[1]))
          return source ? (
            <a
              key={i}
              className={styles.citation}
              href={source.href}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`查看来源${source.id}：${source.title}`}
            >
              {part}
            </a>
          ) : (
            part
          )
        })}
      </p>
      {!!sources.size && (
        <div className={styles.sources} aria-label='回答来源'>
          <span className={styles.sourceLabel}>原文与章节</span>
          {[...sources.values()].map(source => (
            <a
              key={source.id}
              href={source.href}
              target='_blank'
              rel='noopener noreferrer'
            >
              <span className={styles.sourceNumber}>{source.id}</span>
              <span>
                <strong>{source.title}</strong>
                {source.section && <small>{source.section}</small>}
              </span>
              <span aria-hidden='true'>↗</span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}

export default function ArticleChat({ post }) {
  const article =
    post?.type === 'Post' && post.status === 'Published' && !post.password
      ? post
      : null
  const [open, setOpen] = useState(false)
  const [fontFamily, setFontFamily] = useState()
  const [scope, setScope] = useState(article ? 'article' : 'site')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const buttonRef = useRef(null)
  const messagesRef = useRef(null)
  const requestRef = useRef(null)
  const rounds = messages.filter(message => message.role === 'user').length

  useEffect(() => {
    const theme = document.querySelector('[id^="theme-"]')
    if (theme) setFontFamily(window.getComputedStyle(theme).fontFamily)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    if (open) window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open])

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight })
  }, [messages, loading, error])
  useEffect(() => () => requestRef.current?.abort(), [])

  const reset = nextScope => {
    requestRef.current?.abort()
    requestRef.current = null
    setLoading(false)
    setScope(nextScope || scope)
    setMessages([])
    setError('')
    setInput('')
    inputRef.current?.focus()
  }

  const ask = async text => {
    const question = text.trim()
    if (!question || loading || question.length > 500) return
    const retry =
      messages.at(-1)?.role === 'user' && messages.at(-1)?.content === question
    if (rounds >= 8 && !retry) return
    const next = retry
      ? messages
      : [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setError('')
    setLoading(true)
    const controller = new AbortController()
    requestRef.current = controller
    const timer = setTimeout(() => controller.abort(), 55000)
    try {
      const response = await fetch('/api/article-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          scope,
          postId: scope === 'article' ? article.id : undefined,
          history: next
            .slice(0, -1)
            .slice(-4)
            .map(({ role, content }) => ({
              role,
              content: content.slice(0, 400)
            }))
        })
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? '提问有些频繁，请稍后再试。'
            : json.error || '文章问答暂时无法连接，请稍后重试。'
        )
      if (typeof json.answer !== 'string')
        throw new Error('没有收到回答，请稍后重试。')
      if (requestRef.current !== controller) return
      setMessages([
        ...next,
        { role: 'assistant', content: json.answer, sources: json.sources || [] }
      ])
    } catch (failure) {
      if (requestRef.current !== controller) return
      setError(
        failure.name === 'AbortError'
          ? '这次等待时间有些长，请稍后重试。'
          : failure.message
      )
      setInput(question)
    } finally {
      clearTimeout(timer)
      if (requestRef.current === controller) {
        setLoading(false)
        requestRef.current = null
      }
    }
  }

  return (
    <div className={styles.widget} style={{ fontFamily }}>
      {open && (
        <section
          className={styles.panel}
          id='article-chat-panel'
          role='dialog'
          aria-modal='false'
          aria-labelledby='article-chat-title'
        >
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>JUPYTERMOU’S NOTES</span>
              <h2 id='article-chat-title'>和文章聊一聊</h2>
            </div>
            <button
              className={styles.close}
              aria-label='关闭文章问答'
              onClick={() => {
                setOpen(false)
                buttonRef.current?.focus()
              }}
            >
              ×
            </button>
          </header>
          <div className={styles.scope} aria-label='问答范围'>
            <button
              aria-pressed={scope === 'article'}
              disabled={!article}
              onClick={() => scope !== 'article' && reset('article')}
            >
              问当前文章
            </button>
            <button
              aria-pressed={scope === 'site'}
              onClick={() => scope !== 'site' && reset('site')}
            >
              搜索全站文章
            </button>
          </div>
          {scope === 'article' && (
            <p className={styles.articleTitle} title={article?.title}>
              正在阅读 · {article?.title}
            </p>
          )}
          <div
            className={styles.messages}
            ref={messagesRef}
            role='log'
            aria-label='文章问答记录'
            aria-live='polite'
            aria-busy={loading}
          >
            {!messages.length && (
              <div className={styles.welcome}>
                <span className={styles.book} aria-hidden='true'>
                  ↗
                </span>
                <h3>
                  从一篇文章，
                  <br />
                  找到问题的线索。
                </h3>
                <p>
                  我会查找本站公开文章，回答附原文出处。没有足够依据时，会直接告诉你。
                </p>
                <div className={styles.suggestions}>
                  {(scope === 'article'
                    ? ['这篇文章主要讲了什么？', '文中提到了哪些实验和局限？']
                    : [
                        '本站有哪些关于 OCR 不确定性的文章？',
                        'OmniParser V2 的主要方法是什么？'
                      ]
                  ).map(question => (
                    <button key={question} onClick={() => void ask(question)}>
                      {question}
                      <span aria-hidden='true'>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={message.role === 'user' ? styles.user : styles.reply}
              >
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <Answer message={message} />
                )}
              </div>
            ))}
            {loading && (
              <p className={styles.loading}>
                <span aria-hidden='true' />
                正在查找文章与出处…
              </p>
            )}
          </div>
          {error && (
            <p className={styles.error} role='alert'>
              {error}
            </p>
          )}
          {rounds >= 8 && !error && (
            <p className={styles.limit}>
              本轮已聊了8个问题，开启新对话后可以继续。
            </p>
          )}
          <form
            className={styles.form}
            onSubmit={event => {
              event.preventDefault()
              void ask(input)
            }}
          >
            <label className={styles.srOnly} htmlFor='article-chat-input'>
              你的问题
            </label>
            <textarea
              ref={inputRef}
              id='article-chat-input'
              value={input}
              maxLength={500}
              rows={2}
              placeholder={
                scope === 'article' ? '问问这篇文章…' : '在本站文章里找一找…'
              }
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  event.preventDefault()
                  void ask(input)
                }
              }}
            />
            <div className={styles.formFooter}>
              <button
                type='button'
                className={styles.reset}
                onClick={() => reset()}
              >
                开启新对话
              </button>
              <span>{input.length}/500</span>
              <button
                type='submit'
                className={styles.send}
                disabled={loading || !input.trim() || (rounds >= 8 && !error)}
                aria-label='发送问题'
              >
                ↑
              </button>
            </div>
          </form>
          <p className={styles.note}>回答由 AI 整理，请以引用的原文为准。</p>
        </section>
      )}
      <button
        ref={buttonRef}
        type='button'
        className={styles.fab}
        aria-label={open ? '收起文章问答' : '打开文章问答'}
        aria-expanded={open}
        aria-controls='article-chat-panel'
        onClick={() => setOpen(!open)}
      >
        <svg
          width='21'
          height='21'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.6'
          aria-hidden='true'
        >
          <path d='M5 4.5h14a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2h-7l-5.5 4v-4H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z' />
          <path d='M7 9h10M7 12.5h6' />
        </svg>
        <span>{open ? '收起' : '文章问答'}</span>
      </button>
    </div>
  )
}
