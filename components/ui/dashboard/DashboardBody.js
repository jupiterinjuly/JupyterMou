'use client'
import dynamic from 'next/dynamic'

const DashboardItemHome = dynamic(() => import('./DashboardItemHome'))
/**
 * 仪表盘内容主体
 * 组件懒加载
 * @returns
 */
export default function DashboardBody({ pageIcons }) {
  return (
    <div className='w-full max-w-7xl mx-auto px-1 md:px-4 pt-20 mb-12'>
      <DashboardItemHome pageIcons={pageIcons} />
    </div>
  )
}
