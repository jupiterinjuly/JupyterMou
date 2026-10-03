import AnalyticsTrendChart from '@/components/analytics/AnalyticsTrendChart'
import VisitorGlobe from '@/components/analytics/VisitorGlobe'
import SmartLink from '@/components/SmartLink'
import useAnalyticsSummary from '@/hooks/useAnalyticsSummary'

const formatNumber = value => new Intl.NumberFormat('zh-CN').format(value || 0)
const countryFlag = code =>
  /^[A-Z]{2}$/.test(code || '')
    ? String.fromCodePoint(
        ...[...code].map(letter => letter.charCodeAt(0) + 127397)
      )
    : '🌍'

const fallbackPageEmoji = path => {
  if (path === '/') return '🏠'
  if (path.startsWith('/dashboard')) return '🌏'
  if (path.startsWith('/about')) return '👋'
  return '📄'
}

const pageTitle = page => {
  if (page.path === '/') return '首页 · 从这里出发'
  if (page.path === '/dashboard') return '世界从哪里来？'
  return page.title.split(' | JupyterMou')[0]
}

const Panel = ({ children, className = '' }) => (
  <section
    className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-hexo-black-gray shadow-sm p-5 md:p-6 ${className}`}
  >
    {children}
  </section>
)

const KpiCard = ({ icon, label, value, accent }) => (
  <Panel className='relative overflow-hidden'>
    <div
      className={`absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-10 ${accent}`}
    />
    <div className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
      <i className={`${icon} mr-2`} />
      {label}
    </div>
    <div className='text-3xl font-semibold text-gray-900 dark:text-white tabular-nums'>
      {formatNumber(value)}
    </div>
  </Panel>
)

const LoadingDashboard = () => (
  <div className='animate-pulse space-y-6' aria-label='正在加载站点数据'>
    <div className='h-16 rounded-xl bg-gray-200 dark:bg-gray-800' />
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {[0, 1, 2, 3].map(item => (
        <div
          key={item}
          className='h-32 rounded-2xl bg-gray-200 dark:bg-gray-800'
        />
      ))}
    </div>
    <div className='h-80 rounded-2xl bg-gray-200 dark:bg-gray-800' />
  </div>
)

export default function DashboardItemHome({ pageIcons = [] }) {
  const { data, error, loading, retry } = useAnalyticsSummary()

  if (loading) return <LoadingDashboard />

  if (error || !data) {
    return (
      <Panel className='text-center py-16'>
        <i className='fas fa-chart-line text-4xl text-gray-300 dark:text-gray-600 mb-4' />
        <h1 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>
          站点数据暂不可用
        </h1>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 mb-5'>
          数据服务尚未配置完成，或正在短暂维护。
        </p>
        <button
          type='button'
          onClick={() => {
            void retry()
          }}
          className='px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white'
        >
          重新加载
        </button>
      </Panel>
    )
  }

  const updatedAt = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data.updatedAt))

  return (
    <div className='space-y-5 md:space-y-6 text-gray-800 dark:text-gray-200'>
      <header className='text-center max-w-3xl mx-auto pt-1 pb-4 md:pb-6'>
        <div>
          <p className='text-indigo-500 dark:text-indigo-300 text-sm font-medium mb-3'>
            Where are you from? · JupyterMou
          </p>
          <h1 className='text-3xl md:text-4xl font-semibold'>世界从哪里来？</h1>
          <p className='text-gray-500 dark:text-gray-400 mt-4 leading-relaxed px-2'>
            每一次点开，都是从某个角落寄来的问候。一起看看文字去过了哪里。
          </p>
        </div>
        <div className='text-xs text-gray-400 dark:text-gray-500 mt-4'>
          更新于 {updatedAt} · 数据每 30 分钟刷新
        </div>
      </header>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        <KpiCard
          icon='fas fa-user-group'
          label='近7天用户'
          value={data.summary.sevenDayUsers}
          accent='bg-violet-500'
        />
        <KpiCard
          icon='fas fa-eye'
          label='近7天浏览量'
          value={data.summary.sevenDayViews}
          accent='bg-indigo-500'
        />
        <KpiCard
          icon='fas fa-users'
          label='累计用户'
          value={data.summary.allTimeUsers}
          accent='bg-purple-500'
        />
        <KpiCard
          icon='fas fa-chart-simple'
          label='累计浏览量'
          value={data.summary.allTimeViews}
          accent='bg-fuchsia-500'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6'>
        <Panel className='lg:col-span-2'>
          <h2 className='text-lg font-semibold mb-1'>最近7天趋势</h2>
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-5'>
            每日用户数与页面浏览量
          </p>
          <AnalyticsTrendChart trend={data.trend} />
        </Panel>
        <Panel>
          <h2 className='text-lg font-semibold'>来自世界的足迹</h2>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            按历史访客国家汇总 · 悬停光点可看详情
          </p>
          <VisitorGlobe countries={data.countries} size={300} />
          <div className='text-center text-xs text-gray-400'>
            {data.countries.length} 个国家或地区
          </div>
          <p className='text-center text-[11px] leading-relaxed text-gray-400 mt-2'>
            光点为国家汇总位置，并非访客的精确坐标
          </p>
        </Panel>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6'>
        <Panel>
          <h2 className='text-lg font-semibold mb-5'>近7天热门页面 Top 5</h2>
          <ol className='space-y-2'>
            {data.topPages.length === 0 && (
              <li className='text-sm text-gray-500'>暂无页面数据</li>
            )}
            {data.topPages.map((page, index) => {
              const maxViews = Math.max(1, data.topPages[0]?.views || 1)
              const width = Math.max(6, (page.views / maxViews) * 100)
              const notionIcon = pageIcons.find(item => item.path === page.path)?.icon
              return (
                <li key={`${page.path}-${index}`}>
                  <SmartLink
                    href={page.path}
                    title={page.title}
                    className='group flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-violet-50 dark:hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-colors'
                  >
                    <span className='w-9 h-9 flex-none rounded-xl bg-violet-50 dark:bg-slate-700 flex items-center justify-center text-xl group-hover:scale-110 motion-safe:transition-transform' aria-hidden='true'>
                      {notionIcon && !/^https?:|^data:/.test(notionIcon) ? notionIcon : fallbackPageEmoji(page.path)}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='truncate text-sm font-medium group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors'>
                          <span className='text-xs text-gray-400 mr-2'>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {pageTitle(page)}
                        </span>
                        <span className='flex-none text-xs tabular-nums text-gray-500 dark:text-gray-400'>
                          {formatNumber(page.views)} 次浏览
                        </span>
                      </div>
                      <div className='truncate text-xs text-gray-400 mt-0.5 mb-2'>
                        {page.path}
                      </div>
                      <div className='h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 motion-safe:transition-all motion-safe:duration-500 group-hover:opacity-80'
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </SmartLink>
                </li>
              )
            })}
          </ol>
        </Panel>

        <Panel>
          <h2 className='text-lg font-semibold mb-5'>访问国家 Top 10</h2>
          <ol className='space-y-3'>
            {data.countries.slice(0, 10).map((country, index) => {
              const maxUsers = Math.max(1, data.countries[0]?.users || 1)
              const width = Math.max(6, (country.users / maxUsers) * 100)
              return (
                <li
                  key={country.code}
                  className='rounded-lg px-2 py-1.5 hover:bg-violet-50 dark:hover:bg-slate-800/70 transition-colors'
                >
                  <div className='flex justify-between text-sm mb-1.5'>
                    <span className='flex items-center gap-2'>
                      <span className='text-gray-400 tabular-nums text-xs w-5'>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden='true'>{countryFlag(country.code)}</span>
                      <span>{country.name}</span>
                    </span>
                    <span className='tabular-nums text-gray-500 dark:text-gray-400'>
                      {formatNumber(country.users)}
                    </span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 motion-safe:transition-all motion-safe:duration-500'
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
          <p className='text-[11px] leading-relaxed text-gray-400 mt-5'>
            国家由 GA4 根据访问时的网络信息推断，可能受代理网络等因素影响。
          </p>
        </Panel>
      </div>
    </div>
  )
}
