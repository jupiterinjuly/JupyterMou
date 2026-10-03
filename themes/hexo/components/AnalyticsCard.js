import VisitorGlobe from '@/components/analytics/VisitorGlobe'
import SmartLink from '@/components/SmartLink'
import useAnalyticsSummary from '@/hooks/useAnalyticsSummary'
import Card from './Card'

const formatNumber = value =>
  new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value || 0)

const Stat = ({ label, value }) => (
  <div className='text-center min-w-0'>
    <div className='text-lg font-semibold text-gray-800 dark:text-gray-100'>
      {formatNumber(value)}
    </div>
    <div className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>
      {label}
    </div>
  </div>
)

export function AnalyticsCard() {
  const { data, error, loading } = useAnalyticsSummary()

  return (
    <SmartLink
      href='/dashboard'
      className='block rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400'
      aria-label='查看完整站点数据'
    >
      <Card className='group'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <i className='fas fa-chart-pie mr-2' />
            站点足迹
          </div>
          <i className='fas fa-arrow-right text-xs text-gray-400 group-hover:translate-x-1 transition-transform' />
        </div>

        {loading && (
          <div
            className='animate-pulse space-y-4'
            aria-label='正在加载站点数据'
          >
            <div className='grid grid-cols-3 gap-2'>
              {[0, 1, 2].map(item => (
                <div
                  key={item}
                  className='h-10 rounded bg-gray-100 dark:bg-gray-700'
                />
              ))}
            </div>
            <div className='h-40 w-40 rounded-full mx-auto bg-gray-100 dark:bg-gray-700' />
          </div>
        )}

        {!loading && (error || !data) && (
          <div className='py-10 text-center text-sm text-gray-500 dark:text-gray-400'>
            统计数据暂不可用
          </div>
        )}

        {!loading && data && (
          <>
            <div className='grid grid-cols-3 gap-2 border-b dark:border-gray-700 pb-3'>
              <Stat label='累计访问' value={data.summary.allTimeViews} />
              <Stat label='近7天用户' value={data.summary.sevenDayUsers} />
              <Stat label='近7天浏览' value={data.summary.sevenDayViews} />
            </div>
            <VisitorGlobe countries={data.countries} size={176} compact />
            <div className='text-center text-xs text-indigo-500 dark:text-indigo-300 mt-1'>
              查看完整数据 →
            </div>
          </>
        )}
      </Card>
    </SmartLink>
  )
}
