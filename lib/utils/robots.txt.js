import fs from 'fs'
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'

export function generateRobotsTxt(props) {
  const LINK = siteConfig('LINK', BLOG.LINK, props?.NOTION_CONFIG).replace(
    /\/+$/g,
    ''
  )
  const content = `
    # *
    User-agent: *
    Allow: /
  
    # Host
    Host: ${LINK}
  
    # Sitemaps
    Sitemap: ${LINK}/sitemap.xml
  
    `
  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
  } catch (error) {
    // 在vercel运行环境是只读的，这里会报错；
    // 但在vercel编译阶段、或VPS等其他平台这行代码会成功执行
  }
}
