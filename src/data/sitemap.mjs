import { landings, withTrailingSlash } from './landings.mjs'

export const SITEMAP_LASTMOD = '2026-10-22'
export const SITEMAP_ORIGIN = 'https://wiishlist.netlify.app'

export function staticSitemapPaths() {
  return ['/', '/how-to', ...landings.map((page) => page.path)].map((path) =>
    path === '/' ? '/' : withTrailingSlash(path),
  )
}

export function sitemapXml(origin = SITEMAP_ORIGIN) {
  const base = String(origin || SITEMAP_ORIGIN).replace(/\/$/, '')
  const body = staticSitemapPaths()
    .map((path) => {
      const loc = `${base}${path === '/' ? '/' : path}`
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${SITEMAP_LASTMOD}</lastmod>\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
