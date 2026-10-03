const WIDTH = 680
const HEIGHT = 260
const PADDING = 34

const toPoints = (values, maxValue) =>
  values
    .map((value, index) => {
      const x =
        values.length === 1
          ? WIDTH / 2
          : PADDING + (index / (values.length - 1)) * (WIDTH - PADDING * 2)
      const y = HEIGHT - PADDING - (value / maxValue) * (HEIGHT - PADDING * 2)
      return `${x},${y}`
    })
    .join(' ')

export default function AnalyticsTrendChart({ trend = [] }) {
  if (!trend.length) {
    return (
      <div className='h-64 flex items-center justify-center text-gray-500 dark:text-gray-400'>
        暂无趋势数据
      </div>
    )
  }

  const users = trend.map(item => item.users)
  const views = trend.map(item => item.views)
  const maxValue = Math.max(1, ...users, ...views)

  return (
    <div>
      <div className='flex gap-5 text-sm mb-3 text-gray-600 dark:text-gray-300'>
        <span>
          <i className='inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2' />
          浏览量
        </span>
        <span>
          <i className='inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2' />
          用户数
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className='w-full h-auto'
        role='img'
        aria-label='最近七天用户数与浏览量趋势'
      >
        {[0.25, 0.5, 0.75].map(ratio => (
          <line
            key={ratio}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={HEIGHT - PADDING - ratio * (HEIGHT - PADDING * 2)}
            y2={HEIGHT - PADDING - ratio * (HEIGHT - PADDING * 2)}
            className='stroke-gray-200 dark:stroke-gray-700'
            strokeWidth='1'
          />
        ))}
        <polyline
          points={toPoints(views, maxValue)}
          fill='none'
          stroke='#6366f1'
          strokeWidth='5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <polyline
          points={toPoints(users, maxValue)}
          fill='none'
          stroke='#10b981'
          strokeWidth='5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        {trend.map((item, index) => {
          const x =
            trend.length === 1
              ? WIDTH / 2
              : PADDING + (index / (trend.length - 1)) * (WIDTH - PADDING * 2)
          return (
            <text
              key={item.date}
              x={x}
              y={HEIGHT - 8}
              textAnchor='middle'
              className='fill-gray-500 dark:fill-gray-400 text-[18px]'
            >
              {item.date.slice(5)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
