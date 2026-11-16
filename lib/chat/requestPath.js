// Shared with Edge middleware: only the WAF-protected canonical API path may
// reach a paid model. Locale-prefixed and encoded aliases must fail closed.
export function isNonCanonicalChatPath(url) {
  try {
    const path = new URL(url).pathname
    const decoded = decodeURIComponent(path)
    return (
      /^\/(?:[^/]+\/)?api\/article-chat\/?$/.test(decoded) &&
      path !== '/api/article-chat'
    )
  } catch {
    return false
  }
}
