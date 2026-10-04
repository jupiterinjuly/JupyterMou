import QrCode from '@/components/QrCode'
import { siteConfig } from '@/lib/config'
import { useRef, useState } from 'react'
import { handleEmailClick } from '@/lib/plugins/mailEncrypt'

/**
 * 社交联系方式按钮组
 * @returns {JSX.Element}
 * @constructor
 */
const SocialButton = () => {
  const CONTACT_GITHUB = siteConfig('CONTACT_GITHUB')
  const CONTACT_TWITTER = siteConfig('CONTACT_TWITTER')
  const CONTACT_TELEGRAM = siteConfig('CONTACT_TELEGRAM')

  const CONTACT_LINKEDIN = siteConfig('CONTACT_LINKEDIN')
  const CONTACT_WEIBO = siteConfig('CONTACT_WEIBO')
  const CONTACT_INSTAGRAM = siteConfig('CONTACT_INSTAGRAM')
  const CONTACT_INSTAGRAM_QR_IMAGE = siteConfig('CONTACT_INSTAGRAM_QR_IMAGE')
  const CONTACT_EMAIL = siteConfig('CONTACT_EMAIL')
  const ENABLE_RSS = siteConfig('ENABLE_RSS')
  const CONTACT_BILIBILI = siteConfig('CONTACT_BILIBILI')
  const CONTACT_YOUTUBE = siteConfig('CONTACT_YOUTUBE')

  const CONTACT_XIAOHONGSHU = siteConfig('CONTACT_XIAOHONGSHU')
  const CONTACT_ZHISHIXINGQIU = siteConfig('CONTACT_ZHISHIXINGQIU')
  const CONTACT_WECHAT_PUBLIC =
    siteConfig('CONTACT_WECHAT_PUBLIC') || siteConfig('CONTACT_WEHCHAT_PUBLIC')
  const CONTACT_WECHAT_QR_IMAGE = siteConfig('CONTACT_WECHAT_QR_IMAGE')

  const [instagramQrShow, setInstagramQrShow] = useState(false)
  const [wechatQrShow, setWechatQrShow] = useState(false)

  const emailIcon = useRef(null)

  return (
    <div className='w-full justify-center flex-wrap flex'>
      <div className='space-x-3 text-xl flex items-center text-gray-600 dark:text-gray-300 '>
        {CONTACT_GITHUB && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'github'}
            href={CONTACT_GITHUB}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-github dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_TWITTER && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'twitter'}
            href={CONTACT_TWITTER}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-twitter dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_TELEGRAM && (
          <a
            target='_blank'
            rel='noreferrer'
            href={CONTACT_TELEGRAM}
            title={'telegram'}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-telegram dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_LINKEDIN && (
          <a
            target='_blank'
            rel='noreferrer'
            href={CONTACT_LINKEDIN}
            title={'linkIn'}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-linkedin dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_WEIBO && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'weibo'}
            href={CONTACT_WEIBO}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-weibo dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_INSTAGRAM && (
          <span
            className='relative inline-flex'
            onMouseEnter={() => setInstagramQrShow(true)}
            onMouseLeave={() => setInstagramQrShow(false)}
          >
            <a
              target='_blank'
              rel='noreferrer'
              title={'instagram'}
              href={CONTACT_INSTAGRAM}
            >
              <i className='transform hover:scale-125 duration-150 fab fa-instagram dark:hover:text-indigo-400 hover:text-indigo-600' />
            </a>
            {CONTACT_INSTAGRAM_QR_IMAGE && instagramQrShow && (
              <span className='z-40 absolute bottom-9 left-1/2 -translate-x-1/2 rounded-lg bg-white p-2 shadow-xl'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className='w-44 max-w-none rounded-md'
                  src={CONTACT_INSTAGRAM_QR_IMAGE}
                  alt='Instagram 二维码'
                  width='786'
                  height='1310'
                  loading='eager'
                />
              </span>
            )}
          </span>
        )}
        {CONTACT_EMAIL && (
          <a
            onClick={e => handleEmailClick(e, emailIcon, CONTACT_EMAIL)}
            title='email'
            className='cursor-pointer'
            ref={emailIcon}
          >
            <i className='transform hover:scale-125 duration-150 fas fa-envelope dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {ENABLE_RSS && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'RSS'}
            href={'/rss/feed.xml'}
          >
            <i className='transform hover:scale-125 duration-150 fas fa-rss dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_BILIBILI && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'bilibili'}
            href={CONTACT_BILIBILI}
          >
            <i className='transform hover:scale-125 duration-150 dark:hover:text-indigo-400 hover:text-indigo-600 fab fa-bilibili' />
          </a>
        )}
        {CONTACT_YOUTUBE && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'youtube'}
            href={CONTACT_YOUTUBE}
          >
            <i className='transform hover:scale-125 duration-150 fab fa-youtube dark:hover:text-indigo-400 hover:text-indigo-600' />
          </a>
        )}
        {CONTACT_XIAOHONGSHU && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'小红书'}
            href={CONTACT_XIAOHONGSHU}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className='transform hover:scale-125 duration-150 w-6'
              src='/svg/xiaohongshu.svg'
              alt='小红书'
            />
          </a>
        )}
        {CONTACT_ZHISHIXINGQIU && (
          <a
            target='_blank'
            rel='noreferrer'
            title={'知识星球'}
            href={CONTACT_ZHISHIXINGQIU}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className='transform hover:scale-125 duration-150 w-6'
              src='/svg/zhishixingqiu.svg'
              alt='知识星球'
            />{' '}
          </a>
        )}
        {(CONTACT_WECHAT_PUBLIC || CONTACT_WECHAT_QR_IMAGE) && (
          <button
            className='relative inline-flex'
            onMouseEnter={() => setWechatQrShow(true)}
            onMouseLeave={() => setWechatQrShow(false)}
            aria-label={'微信'}
          >
            <div id='wechat-button'>
              <i className='transform scale-105 hover:scale-125 duration-150 fab fa-weixin  dark:hover:text-indigo-400 hover:text-indigo-600' />
            </div>
            {wechatQrShow && (
              <span className='z-40 absolute bottom-9 left-1/2 -translate-x-1/2 rounded-lg bg-white p-2 shadow-xl'>
                {CONTACT_WECHAT_QR_IMAGE ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    className='w-44 max-w-none rounded-md'
                    src={CONTACT_WECHAT_QR_IMAGE}
                    alt='微信二维码'
                    width='888'
                    height='1131'
                    loading='eager'
                  />
                ) : (
                  <span className='block h-36 w-36'>
                    <QrCode value={CONTACT_WECHAT_PUBLIC} />
                  </span>
                )}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
export default SocialButton
