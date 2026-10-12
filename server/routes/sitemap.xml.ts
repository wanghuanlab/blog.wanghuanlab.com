const STATIC_PATHS = ['/', '/posts', '/categories', '/tags', '/archives', '/about']

interface SitemapEntry {
  path: string
  lastmod?: string
}

export default defineEventHandler(async (event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const posts = await getPublishedPosts(event)
  const latest = posts[0] ? (posts[0].updated ?? posts[0].date) : undefined

  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map(path => ({ path, lastmod: latest })),
    ...posts.map(post => ({ path: post.path, lastmod: post.updated ?? post.date })),
    ...collectCategories(posts).map(term => ({ path: `/categories/${term.slug}` })),
    ...collectTags(posts).map(term => ({ path: `/tags/${term.slug}` })),
  ]

  const urls = entries.map(({ path, lastmod }) => {
    const loc = escapeXml(encodeURI(absoluteUrl(siteUrl, path)))
    return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${formatDate(lastmod)}</lastmod>` : ''}
  </url>`
  }).join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
