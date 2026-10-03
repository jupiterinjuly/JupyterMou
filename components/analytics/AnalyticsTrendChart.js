import { useState } from 'react'

const WIDTH = 680
const HEIGHT = 260
const PADDING = 34

const pointAt = (values, index, maxValue) => ({
  x:
    values.length === 1
      ? WIDTH / 2
      : PADDING + (index / (values.length - 1)) * (WIDTH - PADDING * 2),
  y: HEIGHT - PADDING - (values[index] / maxValue) * (HEIGHT - PADDING * 2)
})

const dateLabel = date => {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export default function AnalyticsTrendChart({ trend = [] }) {
  const [activeIndex, setActiveIndex] = useState(null)

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
  const viewPoints = views.map((_, index) => pointAt(views, index, maxValue))
  const userPoints = users.map((_, index) => pointAt(users, index, maxValue))
  const selected = activeIndex === null ? null : trend[activeIndex]
  const selectedX = activeIndex === null ? 0 : viewPoints[activeIndex].x

  return (
    <div className='relative'>
      <div className='flex gap-5 text-sm mb-3 text-gray-600 dark:text-gray-300'>
        <span>
          <i className='inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2' />
          浏览量
        </span>
        <span>
          <i className='inline-block w-2.5 h-2.5 rounded-full bg-fuchsia-400 mr-2' />
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
          points={viewPoints.map(point => `${point.x},${point.y}`).join(' ')}
          fill='none'
          stroke='#6366f1'
          strokeWidth='5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <polyline
          points={userPoints.map(point => `${point.x},${point.y}`).join(' ')}
          fill='none'
          stroke='#c084fc'
          strokeWidth='5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        {selected && (
          <>
            <line
              x1={selectedX}
              x2={selectedX}
              y1={PADDING}
              y2={HEIGHT - PADDING}
              stroke='#94a3b8'
              strokeDasharray='4 5'
              strokeWidth='1'
            />
            <circle
              cx={viewPoints[activeIndex].x}
              cy={viewPoints[activeIndex].y}
              r='7'
              fill='#6366f1'
              stroke='white'
              strokeWidth='3'
            />
            <circle
              cx={userPoints[activeIndex].x}
              cy={userPoints[activeIndex].y}
              r='7'
              fill='#c084fc'
              stroke='white'
              strokeWidth='3'
            />
          </>
        )}
        {trend.map((item, index) => (
          <circle
            key={`hit-${item.date}`}
            data-series='views'
            role='button'
            tabIndex={0}
            aria-label={`${dateLabel(item.date)}，${item.views} 次浏览，${item.users} 位用户`}
            cx={viewPoints[index].x}
            cy={viewPoints[index].y}
            r='17'
            fill='transparent'
            className='cursor-pointer focus:outline-none'
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setActiveIndex(index)
              }
            }}
          />
        ))}
        {trend.map((item, index) => (
          <circle
            key={`users-hit-${item.date}`}
            data-series='users'
            cx={userPoints[index].x}
            cy={userPoints[index].y}
            r='17'
            fill='transparent'
            className='cursor-pointer'
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index)}
          />
        ))}
        {trend.map((item, index) => {
          return (
            <text
              key={item.date}
              x={viewPoints[index].x}
              y={HEIGHT - 8}
              textAnchor='middle'
              className='fill-gray-500 dark:fill-gray-400 text-[18px]'
            >
              {item.date.slice(5)}
            </text>
          )
        })}
      </svg>
      {selected && (
        <div
          role='status'
          className='pointer-events-none absolute z-10 top-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 px-3 py-2 shadow-lg text-xs text-slate-700 dark:text-slate-100 backdrop-blur-sm'
          style={{ left: `${Math.min(78, Math.max(22, (selectedX / WIDTH) * 100))}%`, transform: 'translateX(-50%)' }}
        >
          <div className='font-semibold mb-1'>{dateLabel(selected.date)}</div>
          <div className='flex gap-3'>
            <span className='text-indigo-600 dark:text-indigo-300'>
              {selected.views} 次浏览
            </span>
            <span className='text-fuchsia-600 dark:text-fuchsia-300'>
              {selected.users} 位用户
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
