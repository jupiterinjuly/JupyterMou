import LazyImage from '@/components/LazyImage'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import FallbackParticles from './FallbackParticles'

const promptLinks = [
  { label: '第一次建站记录', query: '建站' },
  { label: 'AI 学习手记', query: 'AI' },
  { label: '小应用与小游戏', query: '小游戏' }
]

const destinations = [
  {
    label: 'AI 与技术',
    detail: '学习记录与工具实践',
    href: '/category/技术分享',
    icon: 'fa-laptop-code'
  },
  {
    label: '项目与作品',
    detail: '从想法到落地的过程',
    href: '/category/项目经历',
    icon: 'fa-cube'
  },
  {
    label: '生活随笔',
    detail: '记录平凡日子里的闪光',
    href: '/category/心情随笔',
    icon: 'fa-feather'
  },
  {
    label: '摄影与世界',
    detail: '用镜头收藏偶然相遇',
    href: '/article/photography-portfolio',
    icon: 'fa-camera-retro'
  }
]

const getPostHref = post => post?.href || (post?.slug ? `/${post.slug}` : '/')

export default function FallbackPage({ latestPosts = [], statusCode = 404 }) {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const isServerError = Number(statusCode) >= 500
  const recentPosts = useMemo(() => latestPosts.slice(0, 3), [latestPosts])
  const photoPosts = recentPosts
    .filter(post => post?.pageCoverThumbnail)
    .slice(0, 2)

  const submitQuestion = event => {
    event?.preventDefault()
    const normalizedQuestion = question.trim()
    if (normalizedQuestion) {
      void router.push(`/search/${encodeURIComponent(normalizedQuestion)}`)
    }
  }

  const visitRandomPost = () => {
    if (latestPosts.length === 0) {
      void router.push('/')
      return
    }
    const randomPost =
      latestPosts[Math.floor(Math.random() * latestPosts.length)]
    void router.push(getPostHref(randomPost))
  }

  return (
    <section className='fallback-scene relative isolate overflow-hidden bg-hexo-background-gray text-gray-700 dark:bg-black dark:text-gray-200'>
      <FallbackParticles />
      <div
        aria-hidden='true'
        className='fallback-wash absolute inset-0 -z-10'
      />

      {photoPosts[0] && (
        <div
          className='photo-note photo-note-left hidden xl:block'
          aria-hidden='true'
        >
          <div className='photo-note-image'>
            <LazyImage
              src={photoPosts[0].pageCoverThumbnail}
              alt=''
              className='h-full w-full object-cover'
            />
          </div>
          <p>有些页面会走丢，故事一直都在。</p>
        </div>
      )}

      {photoPosts[1] && (
        <div
          className='photo-note photo-note-right hidden xl:block'
          aria-hidden='true'
        >
          <div className='photo-note-image'>
            <LazyImage
              src={photoPosts[1].pageCoverThumbnail}
              alt=''
              className='h-full w-full object-cover'
            />
          </div>
          <p>换个方向，也会遇见新的风景。</p>
        </div>
      )}

      <div className='relative z-10 mx-auto flex min-h-[660px] max-w-5xl flex-col items-center px-5 pb-10 pt-16 sm:px-8 lg:pb-14 lg:pt-20'>
        <div className='fallback-kicker mb-4 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
          <span className='fallback-spark' aria-hidden='true'>
            ✦
          </span>
          {statusCode}
        </div>

        <h1 className='text-center text-3xl font-normal text-gray-900 dark:text-white sm:text-4xl lg:text-5xl'>
          {isServerError ? '页面暂时不可用' : '页面暂时跑丢啦'}
        </h1>
        <p className='mt-4 max-w-xl text-center text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base'>
          {isServerError
            ? '稍后再试，或从下面继续浏览。'
            : '试试问问 Jupiter，或从下面继续浏览。'}
        </p>

        <div className='mt-7 flex flex-wrap justify-center gap-3'>
          <button
            type='button'
            onClick={() => {
              void router.push('/')
            }}
            className='fallback-primary rounded-lg px-5 py-2.5 text-sm font-normal text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:shadow-none'
          >
            <i className='fas fa-home mr-2' aria-hidden='true' />
            返回首页
          </button>
          <button
            type='button'
            onClick={visitRandomPost}
            className='rounded-lg bg-white px-5 py-2.5 text-sm font-normal text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:bg-hexo-black-gray dark:text-gray-200'
          >
            <i
              className='fas fa-shuffle mr-2 text-indigo-500'
              aria-hidden='true'
            />
            随便看看
          </button>
        </div>

        <form
          role='search'
          onSubmit={submitQuestion}
          className='fallback-question mt-10 w-full max-w-3xl rounded-xl bg-white p-4 shadow-md dark:bg-hexo-black-gray sm:p-5'
        >
          <label
            htmlFor='fallback-question'
            className='flex items-center gap-2 text-sm font-normal text-gray-700 dark:text-gray-200'
          >
            <span className='fallback-bot' aria-hidden='true'>
              <i className='fas fa-comment-dots' />
            </span>
            问问 Jupiter
          </label>
          <div className='mt-3 flex items-center rounded-lg bg-gray-100 transition focus-within:ring-2 focus-within:ring-indigo-200 dark:bg-gray-800 dark:focus-within:ring-indigo-500/20'>
            <i
              className='fas fa-search ml-4 text-gray-400'
              aria-hidden='true'
            />
            <input
              id='fallback-question'
              aria-label='问问 Jupiter'
              value={question}
              onChange={event => setQuestion(event.target.value)}
              className='min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm font-light outline-none placeholder:text-gray-400 sm:text-base'
              placeholder='试试问问 Jupiter…'
            />
            <button
              type='submit'
              aria-label='搜索'
              className='mr-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400'
            >
              <i className='fas fa-arrow-right' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            {promptLinks.map(prompt => (
              <SmartLink
                key={prompt.query}
                href={`/search/${encodeURIComponent(prompt.query)}`}
                className='rounded bg-gray-100 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                {prompt.label}
              </SmartLink>
            ))}
          </div>
        </form>

        <div className='mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {destinations.map(destination => (
            <SmartLink
              key={destination.label}
              href={destination.href}
              className='fallback-destination group flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-hexo-black-gray'
            >
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-100 text-indigo-500 transition group-hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-300'>
                <i className={`fas ${destination.icon}`} aria-hidden='true' />
              </span>
              <span className='min-w-0'>
                <strong className='block text-sm font-normal text-gray-700 dark:text-gray-200'>
                  {destination.label}
                </strong>
                <span className='mt-0.5 block truncate text-[11px] text-gray-400'>
                  {destination.detail}
                </span>
              </span>
            </SmartLink>
          ))}
        </div>

        {recentPosts.length > 0 && (
          <div className='mt-10 w-full'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-base font-normal text-gray-700 dark:text-gray-200'>
                <i
                  className='fas fa-history mr-2 text-indigo-500'
                  aria-hidden='true'
                />
                最近更新
              </h2>
              <SmartLink
                href='/archive'
                className='text-xs text-gray-400 transition hover:text-indigo-600'
              >
                查看更多 <span aria-hidden='true'>→</span>
              </SmartLink>
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              {recentPosts.map(post => (
                <SmartLink
                  key={post.id || post.title}
                  href={getPostHref(post)}
                  className='group flex min-w-0 items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition hover:shadow-md dark:bg-hexo-black-gray'
                >
                  {post.pageCoverThumbnail && (
                    <div className='h-14 w-16 shrink-0 overflow-hidden rounded bg-gray-100'>
                      <LazyImage
                        src={post.pageCoverThumbnail}
                        alt={post.title}
                        className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                      />
                    </div>
                  )}
                  <span className='min-w-0'>
                    <strong className='line-clamp-2 block text-sm font-normal leading-5 text-gray-700 dark:text-gray-200'>
                      {post.title}
                    </strong>
                    <span className='mt-1 block text-[11px] text-gray-400'>
                      {post.lastEditedDay || post.publishDay}
                    </span>
                  </span>
                </SmartLink>
              ))}
            </div>
          </div>
        )}

        <nav
          aria-label='个人入口'
          className='mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400'
        >
          <SmartLink href='/about' className='transition hover:text-indigo-600'>
            关于我
          </SmartLink>
          <SmartLink
            href='https://github.com/jupiterinjuly'
            className='transition hover:text-indigo-600'
          >
            GitHub
          </SmartLink>
          <SmartLink
            href='/category/项目经历'
            className='transition hover:text-indigo-600'
          >
            更多作品
          </SmartLink>
        </nav>
      </div>

      <style jsx>{`
        .fallback-wash {
          background:
            radial-gradient(
              circle at 16% 24%,
              rgba(224, 229, 248, 0.72),
              transparent 30%
            ),
            radial-gradient(
              circle at 84% 20%,
              rgba(246, 232, 218, 0.58),
              transparent 28%
            ),
            linear-gradient(180deg, #fafafa 0%, #f5f6fa 58%, #f3f4f7 100%);
        }
        :global(.dark) .fallback-wash {
          background:
            radial-gradient(
              circle at 18% 30%,
              rgba(80, 92, 167, 0.16),
              transparent 25%
            ),
            radial-gradient(
              circle at 82% 18%,
              rgba(167, 109, 77, 0.11),
              transparent 20%
            );
        }
        .fallback-primary {
          background: #6366d9;
        }
        .fallback-spark {
          animation: sparkle 2.8s ease-in-out infinite;
        }
        .fallback-bot {
          display: inline-flex;
          width: 1.8rem;
          height: 1.8rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          color: #5369c8;
          background: #f1f2f7;
        }
        .photo-note {
          position: absolute;
          z-index: 2;
          width: 190px;
          padding: 11px 11px 16px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 12px 30px -18px rgba(30, 41, 59, 0.35);
        }
        .photo-note::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 50%;
          width: 54px;
          height: 19px;
          transform: translateX(-50%) rotate(-2deg);
          background: rgba(231, 224, 208, 0.58);
        }
        .photo-note-left {
          left: 2.5%;
          top: 19%;
          transform: rotate(-7deg);
          animation: drift-left 8s ease-in-out infinite;
        }
        .photo-note-right {
          right: 2.5%;
          top: 24%;
          transform: rotate(6deg);
          animation: drift-right 9s ease-in-out infinite;
        }
        .photo-note-image {
          height: 122px;
          overflow: hidden;
          background: #eef0f6;
        }
        .photo-note p {
          margin: 12px 5px 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.7;
        }
        @keyframes sparkle {
          0%,
          100% {
            transform: rotate(0deg) scale(0.88);
            opacity: 0.7;
          }
          50% {
            transform: rotate(18deg) scale(1.08);
            opacity: 1;
          }
        }
        @keyframes drift-left {
          0%,
          100% {
            transform: rotate(-7deg) translate3d(0, 0, 0);
          }
          50% {
            transform: rotate(-5deg) translate3d(5px, -9px, 0);
          }
        }
        @keyframes drift-right {
          0%,
          100% {
            transform: rotate(6deg) translate3d(0, 0, 0);
          }
          50% {
            transform: rotate(4deg) translate3d(-5px, 8px, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fallback-spark,
          .photo-note-left,
          .photo-note-right,
          .fallback-destination {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  )
}
