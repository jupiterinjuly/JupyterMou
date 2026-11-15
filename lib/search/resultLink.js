export function getSearchResultHref(result, subPath = '') {
  const path = String(
    result.slug || result.postId || result.objectID || ''
  ).replace(/^\/+/, '')
  const prefix = String(subPath).replace(/\/$/, '')
  const anchor = result.anchor ? `#${encodeURIComponent(result.anchor)}` : ''
  return `${prefix}/${path}${anchor}`
}
