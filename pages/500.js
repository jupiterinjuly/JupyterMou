import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'

export default function Custom500(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='Layout404' {...props} />
}

export async function getStaticProps({ locale }) {
  const props = (await fetchGlobalAllData({ from: '500', locale })) || {}
  return {
    props: {
      ...props,
      isFallbackPage: true,
      statusCode: 500
    }
  }
}
