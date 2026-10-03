import AnalyticsTrendChart from '@/components/analytics/AnalyticsTrendChart'
import VisitorGlobe from '@/components/analytics/VisitorGlobe'
import SmartLink from '@/components/SmartLink'
import useAnalyticsSummary from '@/hooks/useAnalyticsSummary'

const formatNumber = value => new Intl.NumberFormat('zh-CN').format(value || 0)

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

export default function DashboardItemHome() {
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
      <header className='flex flex-col md:flex-row md:items-end justify-between gap-3'>
        <div>
          <p className='text-indigo-500 dark:text-indigo-300 text-sm font-medium mb-1'>
            JupyterMou Analytics
          </p>
          <h1 className='text-3xl md:text-4xl font-semibold'>站点数据</h1>
          <p className='text-gray-500 dark:text-gray-400 mt-2'>
            记录文字被看见的足迹，也记录来自世界的偶然相遇。
          </p>
        </div>
        <div className='text-xs text-gray-500 dark:text-gray-400 md:text-right'>
          <div>更新于 {updatedAt}</div>
          <div className='mt-1'>数据每 30 分钟刷新</div>
        </div>
      </header>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        <KpiCard
          icon='fas fa-user-group'
          label='近7天用户'
          value={data.summary.sevenDayUsers}
          accent='bg-emerald-500'
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
          accent='bg-amber-500'
        />
        <KpiCard
          icon='fas fa-chart-simple'
          label='累计浏览量'
          value={data.summary.allTimeViews}
          accent='bg-rose-500'
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
            按历史访客国家汇总
          </p>
          <VisitorGlobe countries={data.countries} size={300} />
          <div className='text-center text-xs text-gray-400'>
            {data.countries.length} 个国家或地区
          </div>
        </Panel>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6'>
        <Panel>
          <h2 className='text-lg font-semibold mb-5'>近7天热门页面 Top 5</h2>
          <ol className='space-y-4'>
            {data.topPages.length === 0 && (
              <li className='text-sm text-gray-500'>暂无页面数据</li>
            )}
            {data.topPages.map((page, index) => (
              <li
                key={`${page.path}-${index}`}
                className='flex items-center gap-3'
              >
                <span className='w-7 h-7 flex-none rounded-lg bg-indigo-50 dark:bg-gray-700 text-indigo-500 dark:text-indigo-300 flex items-center justify-center text-sm font-semibold'>
                  {index + 1}
                </span>
                <SmartLink
                  href={page.path}
                  className='min-w-0 flex-1 hover:text-indigo-500'
                >
                  <div className='truncate text-sm font-medium'>
                    {page.title}
                  </div>
                  <div className='truncate text-xs text-gray-400 mt-0.5'>
                    {page.path}
                  </div>
                </SmartLink>
                <span className='text-sm tabular-nums text-gray-500 dark:text-gray-400'>
                  {formatNumber(page.views)}
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel>
          <h2 className='text-lg font-semibold mb-5'>访问国家 Top 10</h2>
          <ol className='space-y-3'>
            {data.countries.slice(0, 10).map((country, index) => {
              const maxUsers = Math.max(1, data.countries[0]?.users || 1)
              const width = Math.max(6, (country.users / maxUsers) * 100)
              return (
                <li key={country.code}>
                  <div className='flex justify-between text-sm mb-1.5'>
                    <span>
                      {index + 1}. {country.name}
                    </span>
                    <span className='tabular-nums text-gray-500 dark:text-gray-400'>
                      {formatNumber(country.users)}
                    </span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400'
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
