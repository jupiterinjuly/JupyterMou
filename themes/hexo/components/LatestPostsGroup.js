import LazyImage from '@/components/LazyImage'
// import Image from 'next/image'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

/**
 * 最新文章列表
 * @param posts 所有文章数据
 * @param sliceCount 截取展示的数量 默认6
 * @constructor
 */
const LatestPostsGroup = ({ latestPosts, siteInfo }) => {
  // 获取当前路径
  const currentPath = useRouter().asPath

  if (!latestPosts) {
    return <></>
  }

  return (
    <>
      <div className=' mb-2 px-1 flex flex-nowrap justify-between'>
        <div>
          <i className='mr-2 fas fas fa-history' />
          最近更新
        </div>
      </div>
      {latestPosts.map(post => {
        const headerImage = post?.pageCoverThumbnail
          ? post.pageCoverThumbnail
          : siteInfo?.pageCover
        const selected = currentPath === post?.href

        return (
          <SmartLink
            key={post.id}
            title={post.title}
            href={post?.href}
            passHref
            className={'my-3 flex'}>
            <div className='w-20 h-14 overflow-hidden relative'>
              <LazyImage
                alt={post?.title}
                src={`${headerImage}`}
                className='object-cover w-full h-full'
              />
            </div>
            <div
              className={
                (selected ? ' text-indigo-400 ' : 'dark:text-gray-400 ') +
                ' text-sm overflow-x-hidden hover:text-indigo-600 px-2 duration-200 w-full rounded ' +
                ' hover:text-indigo-400 cursor-pointer items-center flex'
              }>
              <div>
                <div className='line-clamp-2 menu-link'>{post.title}</div>
                <div className='text-gray-500'>
                  {post.lastEditedDay || post.publishDay}
                </div>
              </div>
            </div>
          </SmartLink>
        )
      })}
    </>
  )
}
export default LatestPostsGroup
