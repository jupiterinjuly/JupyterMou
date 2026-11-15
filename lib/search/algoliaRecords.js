export const SEARCH_SCHEMA_VERSION = 2
export const isSearchablePost = post =>
  Boolean(
    post &&
    post.type === 'Post' &&
    post.status === 'Published' &&
    !post.password
  )

const unwrap = record => record?.value?.value || record?.value || record
const bytes = text =>
  [...text].reduce(
    (n, c) =>
      n +
      (c.codePointAt(0) > 65535
        ? 4
        : c.charCodeAt(0) > 2047
          ? 3
          : c.charCodeAt(0) > 127
            ? 2
            : 1),
    0
  )
const clean = value =>
  String(value || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
const limited = (value, limit) => {
  let out = ''
  for (const c of clean(value)) {
    if (bytes(out + c) > limit) break
    out += c
  }
  return out
}
const plain = rich =>
  (Array.isArray(rich) ? rich : [])
    .map(item => {
      if (item[0] === '⁍') return item[1]?.find(d => d[0] === 'e')?.[1] || ''
      if (item[0] === '‣') {
        const ref = item[1]?.[0]
        return ref?.[0] === 'd'
          ? ref[1]?.start_date || ''
          : ref?.[0] === 'lm'
            ? ref[1]?.title || ''
            : ''
      }
      return item[0] || ''
    })
    .join('')

function splitText(text, limit = 2600) {
  const chunks = []
  let current = '',
    size = 0
  for (const c of clean(text)) {
    const length = bytes(c)
    if (size + length > limit) {
      const chars = [...current]
      let boundary = chars.length
      for (let i = chars.length - 1; i > chars.length * 0.6; i--) {
        if (/[\s。！？；.!?;]/.test(chars[i])) {
          boundary = i + 1
          break
        }
      }
      chunks.push(chars.slice(0, boundary).join(''))
      current = chars.slice(boundary).join('')
      size = bytes(current)
    }
    current += c
    size += length
  }
  if (current) chunks.push(current)
  return chunks
}

export function buildAlgoliaRecords(post, recordMap = post?.blockMap) {
  if (!isSearchablePost(post)) return []
  const blocks = recordMap?.block || {}
  const get = id =>
    unwrap(
      blocks[id] ||
        blocks[id?.replace(/-/g, '')] ||
        Object.values(blocks).find(
          r => unwrap(r)?.id?.replace(/-/g, '') === id?.replace(/-/g, '')
        )
    )
  const root = get(post.id)
  const sections = []
  let section = { title: '', anchor: '', paragraphs: [] }
  const seen = new Set()
  const walk = id => {
    if (seen.has(id)) return
    seen.add(id)
    const block = get(id)
    if (
      !block ||
      [
        'page',
        'collection_view',
        'collection_view_page',
        'html',
        'file',
        'pdf',
        'video',
        'audio',
        'embed'
      ].includes(block.type)
    )
      return
    const p = block.properties || {}
    const text = clean(
      block.type === 'table_row'
        ? Object.values(p).map(plain).join(' | ')
        : plain(
            block.type === 'image'
              ? p.alt_text || p.caption
              : p.title || p.caption
          )
    ).trim()
    if (['header', 'sub_header', 'sub_sub_header'].includes(block.type)) {
      if (section.paragraphs.length) sections.push(section)
      section = {
        title: text,
        anchor: (block.id || id).replace(/-/g, ''),
        paragraphs: []
      }
    }
    if (text) section.paragraphs.push(text)
    const reference = block.format?.transclusion_reference_pointer?.id
    const children = reference ? get(reference)?.content : block.content
    children?.forEach(walk)
  }
  ;(root?.content || post.content || []).forEach(walk)
  if (section.paragraphs.length) sections.push(section)
  if (!sections.length)
    sections.push({
      title: '',
      anchor: '',
      paragraphs: [post.summary || post.title || '']
    })

  const base = {
    postId: post.id,
    title: limited(post.title, 512),
    category: limited(
      Array.isArray(post.category) ? post.category.join(' / ') : post.category,
      160
    ),
    tags: (Array.isArray(post.tags) ? post.tags : [])
      .slice(0, 10)
      .map(t => limited(t, 80)),
    slug: limited(post.slug || post.id, 512),
    summary: limited(post.summary, 512),
    lastEditedDate: post.lastEditedDate || '',
    schemaVersion: SEARCH_SCHEMA_VERSION
  }
  const records = []
  for (const segment of sections) {
    let content = ''
    const flush = () => {
      if (!content) return
      const record = {
        ...base,
        objectID: records.length ? `${post.id}:${records.length}` : post.id,
        section: limited(segment.title, 512),
        anchor: segment.anchor,
        content
      }
      if (bytes(JSON.stringify(record)) >= 9500)
        throw new Error('Search record exceeds byte budget')
      records.push(record)
      content = ''
    }
    for (const paragraph of segment.paragraphs) {
      for (const part of splitText(paragraph)) {
        if (bytes(content + '\n' + part) > 2600) flush()
        content += (content ? '\n' : '') + part
      }
    }
    flush()
  }
  return records
}
