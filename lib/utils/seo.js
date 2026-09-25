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
