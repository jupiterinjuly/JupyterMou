/**
 * Returns a clean relative path that is safe to publish in the sitemap.
 * External URLs, anchors and internal search result pages are intentionally
 * excluded because they are not canonical, indexable site content.
 */
export function getSitemapPath(value) {
  if (typeof value !== 'string') {
    return null
  }

  const path = value.trim()
  if (
    !path ||
    path.startsWith('#') ||
    path.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    return null
  }

  const normalizedPath = path.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '')

  if (!normalizedPath || /^search(?:\/|$)/i.test(normalizedPath)) {
    return null
  }

  return normalizedPath
}

/**
 * Builds a self-referencing canonical URL from the configured production URL.
 */
export function getCanonicalUrl(siteUrl, routePath = '') {
  const baseUrl = `${siteUrl || ''}`.replace(/\/+$/g, '')
  const path = `${routePath || ''}`.replace(/^\/+|\/+$/g, '')
  return path ? `${baseUrl}/${path}` : `${baseUrl}/`
}

/**
 * Search result pages are utility pages and should not enter the search index.
 */
export function isSearchRoute(route = '') {
  return route === '/search' || route.startsWith('/search/')
}

function normalizeSchemaDate(value) {
  if (typeof value !== 'string') {
    return value
  }

  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) {
    return value
  }

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Keeps article-specific SEO fields together so Open Graph and JSON-LD use
 * the same source values as the visible article page.
 */
export function getArticleSeoMeta(post, siteInfo) {
  const category = Array.isArray(post?.category)
    ? post.category[0]
    : post?.category

  return {
    title: post
      ? `${post.title} | ${siteInfo?.title}`
      : `${siteInfo?.title} | loading`,
    headline: post?.title,
    description: post?.summary,
    type: post?.type,
    slug: post?.slug,
    image: post?.pageCoverThumbnail || `${siteInfo?.pageCover}`,
    category,
    tags: post?.tags,
    publishDay: normalizeSchemaDate(post?.publishDay),
    lastEditedDay: normalizeSchemaDate(post?.lastEditedDay || post?.publishDay)
  }
}

/**
 * Builds schema.org data without depending on browser state, which keeps the
 * published metadata deterministic and easy to validate.
 */
export function buildStructuredData({
  meta,
  siteInfo,
  url,
  image,
  author,
  siteUrl
}) {
  const authorData = {
    '@type': 'Person',
    name: author,
    url: getCanonicalUrl(siteUrl, 'about')
  }
  const publisherData = {
    '@type': 'Organization',
    name: siteInfo?.title,
    url: getCanonicalUrl(siteUrl),
    logo: {
      '@type': 'ImageObject',
      url: siteInfo?.icon
    }
  }

  if (meta?.type === 'Post') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.headline || meta.title,
      description: meta.description,
      image,
      url,
      datePublished: meta.publishDay,
      dateModified: meta.lastEditedDay || meta.publishDay,
      author: authorData,
      publisher: publisherData,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      },
      keywords: Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags,
      articleSection: meta.category
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteInfo?.title,
    description: siteInfo?.description,
    url: getCanonicalUrl(siteUrl),
    author: authorData,
    publisher: publisherData
  }
}
