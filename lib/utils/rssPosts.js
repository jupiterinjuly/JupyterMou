// The sidebar's latestPosts is a short list of recently edited articles.
// Feeds must include the complete public publication list instead.
export function getFeedPosts({ allPages, latestPosts = [] } = {}) {
  if (!Array.isArray(allPages)) return latestPosts
  return allPages
    .filter(
      post =>
        post.type === 'Post' && post.status === 'Published' && !post.password
    )
    .sort(
      (a, b) =>
        new Date(b.publishDate || b.publishDay || 0) -
        new Date(a.publishDate || a.publishDay || 0)
    )
}
