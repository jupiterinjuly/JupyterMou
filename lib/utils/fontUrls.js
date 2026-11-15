export function resolveFontUrls(value) {
  const urls = Array.isArray(value) ? value : value ? [value] : []
  return [
    ...new Set(
      urls.filter(Boolean).map(url => {
        try {
          const path = new URL(url, 'https://www.jupytermou.cn').pathname
          if (
            /\/(?:npm\/)?lxgw-wenkai-webfont@1\.6\.0\/style\.css$/.test(path)
          ) {
            return '/fonts/lxgw-wenkai-1.6.0/style.css'
          }
        } catch {}
        return url
      })
    )
  ]
}
