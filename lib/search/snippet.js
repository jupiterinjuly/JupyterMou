// Algolia snippets contain highlighting markup even when highlighting is
// disabled for ordinary attributes. Return plain text for safe React rendering.
export function getSearchSnippet(result) {
  const snippet = result._snippetResult?.content?.value
  if (!snippet) return String(result.content || '').slice(0, 160)
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'"
  }
  return snippet
    .replace(/<\/?em>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity => entities[entity])
}
