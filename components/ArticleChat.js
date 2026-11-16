import { useEffect, useRef, useState } from 'react'
import {
  ARTICLE_QUESTIONS,
  CHAT_INTERESTS,
  pickQuestions
} from '@/lib/chat/discovery'
import styles from './ArticleChat.module.css'

function Planet() {
  return (
    <span className={styles.planet} aria-hidden='true'>
      <span className={styles.planetSphere} />
      <svg className={styles.planetOrbit} viewBox='0 0 80 80' fill='none'>
        <ellipse
          cx='40'
          cy='41'
          rx='34'
          ry='12'
          transform='rotate(-27 40 41)'
          stroke='currentColor'
          strokeWidth='2.4'
        />
        <path
          d='m65 8 1.4 4.6L71 14l-4.6 1.4L65 20l-1.4-4.6L59 14l4.6-1.4Z'
          fill='currentColor'
        />
        <circle cx='13' cy='20' r='1.8' fill='currentColor' />
        <circle cx='66' cy='63' r='1.3' fill='currentColor' />
      </svg>
    </span>
  )
}

function Answer({ message, content = message.content, revealing = false }) {
  const sources = new Map(
    (message.sources || []).map(source => [source.id, source])
  )
  return (
    <>
      <p className={styles.answer}>
        {content.split(/(\[\d+\])/g).map((part, i) => {
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
        {revealing && <span className={styles.cursor} aria-hidden='true' />}
      </p>
      {!revealing && !!sources.size && (
        <div className={styles.sources} aria-label='回答来源'>
          <span className={styles.sourceLabel}>
            {message.kind === 'site-guide'
              ? '逛逛博客'
              : message.kind === 'recommendation'
                ? '为你找到的文章'
                : '原文与章节'}
          </span>
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
  const [interest, setInterest] = useState(CHAT_INTERESTS[0])
  const [suggestions, setSuggestions] = useState([])
  const [revealingIndex, setRevealingIndex] = useState(null)
  const [visibleAnswer, setVisibleAnswer] = useState('')
  const inputRef = useRef(null)
  const buttonRef = useRef(null)
  const messagesRef = useRef(null)
  const requestRef = useRef(null)
  const followRef = useRef(true)
  const rounds = messages.filter(message => message.role === 'user').length
  const answerText = messages[revealingIndex]?.content

  useEffect(() => {
    setSuggestions(
      pickQuestions(scope === 'article' ? ARTICLE_QUESTIONS : interest)
    )
  }, [scope, interest])

  // Reveal only after the entire answer has passed server citation validation.
  // Citation numbers and Unicode code points are never split mid-token.
  useEffect(() => {
    if (revealingIndex === null || !answerText) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) {
      setRevealingIndex(null)
      return
    }
    const tokens = answerText.match(/\[\d+\]|[\s\S]/gu) || []
    const duration = Math.min(4200, Math.max(700, tokens.length * 12))
    const start = performance.now()
    let timer
    const finish = () => setRevealingIndex(null)
    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / duration)
      setVisibleAnswer(
        tokens.slice(0, Math.ceil(tokens.length * progress)).join('')
      )
      if (progress === 1) finish()
      else timer = setTimeout(tick, 32)
    }
    timer = setTimeout(tick, 32)
    motion.addEventListener('change', finish)
    return () => {
      clearTimeout(timer)
      motion.removeEventListener('change', finish)
    }
  }, [revealingIndex, answerText])

  useEffect(() => {
    const theme = document.querySelector('[id^="theme-"]')
    if (theme) setFontFamily(window.getComputedStyle(theme).fontFamily)
  }, [open])

  useEffect(() => {
    // Opening on a touch device should not immediately summon the keyboard.
    if (open && window.matchMedia('(hover: hover)').matches)
      inputRef.current?.focus()
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
    if (followRef.current)
      messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight })
  }, [messages, loading, error, visibleAnswer, revealingIndex])
  useEffect(() => () => requestRef.current?.abort(), [])

  const reset = nextScope => {
    requestRef.current?.abort()
    requestRef.current = null
    setLoading(false)
    setRevealingIndex(null)
    setVisibleAnswer('')
    followRef.current = true
    setScope(nextScope || scope)
    setMessages([])
    setError('')
    setInput('')
    setSuggestions(
      pickQuestions(
        (nextScope || scope) === 'article' ? ARTICLE_QUESTIONS : interest,
        suggestions
      )
    )
    inputRef.current?.focus()
  }

  const ask = async text => {
    const question = text.trim()
    if (!question || requestRef.current || loading || question.length > 500)
      return
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
    setRevealingIndex(null)
    setVisibleAnswer('')
    followRef.current = true
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
        {
          role: 'assistant',
          content: json.answer,
          sources: json.sources || [],
          kind: json.kind
        }
      ])
      setVisibleAnswer('')
      setRevealingIndex(next.length)
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
              <h2 id='article-chat-title'>
                序秋小星球{' '}
                <span className={styles.headerSpark} aria-hidden='true'>
                  ✧
                </span>
              </h2>
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
              逛逛整个博客
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
            onScroll={event => {
              const el = event.currentTarget
              followRef.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < 70
            }}
            role='log'
            aria-label='文章问答记录'
            aria-live='polite'
            aria-busy={loading || revealingIndex !== null}
          >
            {!messages.length && (
              <div className={styles.welcome}>
                <div className={styles.welcomePlanet}>
                  <Planet />
                </div>
                <h3>你好呀，今天想探索些什么？</h3>
                <p>
                  {scope === 'article'
                    ? '一起读懂这篇文章。可以问重点、聊思路，也可以从一个难懂的地方开始。'
                    : '我是序秋小星球。选一个感兴趣的方向，或把问题直接交给我。'}
                </p>
                {scope === 'site' && (
                  <div className={styles.interests} aria-label='选择兴趣'>
                    {CHAT_INTERESTS.map(item => (
                      <button
                        key={item.id}
                        aria-pressed={interest.id === item.id}
                        onClick={() => setInterest(item)}
                      >
                        <span aria-hidden='true'>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.suggestionHeading}>
                  <span>
                    {scope === 'article'
                      ? '从这里聊起'
                      : `${interest.label} · 试着问问`}
                  </span>
                  <button
                    onClick={() =>
                      setSuggestions(
                        pickQuestions(
                          scope === 'article' ? ARTICLE_QUESTIONS : interest,
                          suggestions
                        )
                      )
                    }
                  >
                    换一组 <span aria-hidden='true'>↻</span>
                  </button>
                </div>
                <div className={styles.suggestions}>
                  {suggestions.map(question => (
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
                  <>
                    <Answer
                      message={message}
                      content={
                        revealingIndex === i ? visibleAnswer : message.content
                      }
                      revealing={revealingIndex === i}
                    />
                    {revealingIndex === i && (
                      <button
                        className={styles.revealAll}
                        onClick={() => setRevealingIndex(null)}
                      >
                        立即显示全文
                      </button>
                    )}
                  </>
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
                scope === 'article'
                  ? '这篇文章，有哪里想一起聊聊？'
                  : '想了解博主，还是找一篇感兴趣的文章？'
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
      <div className={styles.launcher}>
        {!open && (
          <div id='article-chat-hint' role='tooltip' className={styles.hint}>
            想从哪里开始？
            <br />
            <strong>试着问我吧 ✨</strong>
          </div>
        )}
        <button
          ref={buttonRef}
          type='button'
          className={styles.fab}
          aria-label={open ? '收起文章问答' : '打开文章问答'}
          aria-expanded={open}
          aria-controls='article-chat-panel'
          aria-describedby={!open ? 'article-chat-hint' : undefined}
          onClick={() => setOpen(!open)}
        >
          <Planet />
          {open && (
            <span className={styles.planetClose} aria-hidden='true'>
              ×
            </span>
          )}
          <span className={styles.srOnly}>{open ? '收起' : '序秋小星球'}</span>
        </button>
      </div>
    </div>
  )
}
