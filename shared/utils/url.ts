/** 规范化站内路径：保证以 `/` 开头、去掉结尾 `/`（根路径除外）、去掉 query 与 hash。 */
export function normalizePath(path: string): string {
  const pathname = path.split(/[?#]/)[0] || '/'
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : withLeading
}

/** 基于站点根地址生成绝对 URL，用于 canonical、Open Graph、RSS 与 Sitemap。 */
export function absoluteUrl(siteUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  const base = siteUrl.replace(/\/+$/, '')
  const normalized = normalizePath(path)
  return normalized === '/' ? `${base}/` : `${base}${normalized}`
}
