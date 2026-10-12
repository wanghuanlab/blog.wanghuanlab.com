import { siteConfig } from '~~/config/site'

const RSS_ITEM_LIMIT = 30

export default defineEventHandler(async (event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const posts = (await getPublishedPosts(event)).slice(0, RSS_ITEM_LIMIT)
  const feedUrl = absoluteUrl(siteUrl, '/rss.xml')
  const lastBuildDate = posts[0] ? toUtcDate(posts[0].updated ?? posts[0].date) : new Date()

  const items = posts.map((post) => {
    const url = absoluteUrl(siteUrl, post.path)
    const categories = [post.category, ...(post.tags ?? [])]
      .map(name => `      <category>${escapeXml(name)}</category>`)
      .join('\n')

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toUtcDate(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description ?? '')}</description>
      <author>${escapeXml(`${siteConfig.author.email} (${siteConfig.author.name})`)}</author>
${categories}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${absoluteUrl(siteUrl, '/')}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.locale}</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return xml
})
