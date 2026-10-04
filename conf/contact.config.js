const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'xinyimou77@gmail.com'

/**
 * 社交按钮相关的配置同意放这
 */
module.exports = {
  // 社交链接，不需要可留空白，例如 CONTACT_WEIBO:''
  CONTACT_EMAIL: btoa(unescape(encodeURIComponent(contactEmail))), // 邮箱地址 例如mail@tangly1024.com
  CONTACT_WEIBO: process.env.NEXT_PUBLIC_CONTACT_WEIBO || '', // 你的微博个人主页
  CONTACT_TWITTER: process.env.NEXT_PUBLIC_CONTACT_TWITTER || '', // 你的twitter个人主页
  CONTACT_GITHUB:
    process.env.NEXT_PUBLIC_CONTACT_GITHUB ||
    'https://github.com/jupiterinjuly', // 你的github个人主页 例如 https://github.com/tangly1024
  CONTACT_TELEGRAM: process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || '', // 你的telegram 地址 例如 https://t.me/tangly_1024
  CONTACT_LINKEDIN:
    process.env.NEXT_PUBLIC_CONTACT_LINKEDIN ||
    'https://www.linkedin.com/in/xinyi-mou-3457a7387/', // 你的linkedIn 首页
  CONTACT_INSTAGRAM:
    process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM ||
    'https://www.instagram.com/jupiter_injuly/', // 您的instagram地址
  CONTACT_INSTAGRAM_QR_IMAGE:
    process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM_QR_IMAGE ||
    '/images/contact/instagram.jpg',
  CONTACT_BILIBILI:
    process.env.NEXT_PUBLIC_CONTACT_BILIBILI ||
    'https://space.bilibili.com/284909002', // B站主页
  CONTACT_YOUTUBE: process.env.NEXT_PUBLIC_CONTACT_YOUTUBE || '', // Youtube主页
  CONTACT_XIAOHONGSHU: process.env.NEXT_PUBLIC_CONTACT_XIAOHONGSHU || '', // 小红书主页
  CONTACT_ZHISHIXINGQIU: process.env.NEXT_PUBLIC_CONTACT_ZHISHIXINGQIU || '', // 知识星球
  CONTACT_WECHAT_PUBLIC:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_PUBLIC ||
    process.env.NEXT_PUBLIC_CONTACT_WEHCHAT_PUBLIC ||
    '', // 微信公众号（WEHCHAT 为历史拼写）
  CONTACT_WEHCHAT_PUBLIC:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_PUBLIC ||
    process.env.NEXT_PUBLIC_CONTACT_WEHCHAT_PUBLIC ||
    '', // 兼容旧配置名
  CONTACT_WECHAT_QR_IMAGE:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_QR_IMAGE ||
    '/images/contact/wechat.jpg'
}
