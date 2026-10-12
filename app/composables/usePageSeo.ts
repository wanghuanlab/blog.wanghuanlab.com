import type { MaybeRefOrGetter } from 'vue'
import { siteConfig } from '~~/config/site'

export interface PageSeoOptions {
  /** 页面标题；省略时使用站点名称作为完整标题。 */
  title?: string
  description?: string
  /** 站内路径，用于生成 canonical 与 og:url。 */
  path: string
  type?: 'website' | 'article'
  image?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noindex?: boolean
}

/** 统一设置 title、description、canonical、Open Graph 与 Twitter Card。 */
export function usePageSeo(input: MaybeRefOrGetter<PageSeoOptions>) {
  const { siteUrl } = useRuntimeConfig().public

  const seo = computed(() => {
    const options = toValue(input)
    const title = options.title
      ? `${options.title} · ${siteConfig.name}`
      : `${siteConfig.name} · ${siteConfig.tagline}`
    const isArticle = options.type === 'article'

    return {
      ...options,
      title,
      description: options.description || siteConfig.description,
      url: absoluteUrl(siteUrl, options.path),
      image: absoluteUrl(siteUrl, options.image || siteConfig.ogImage),
      publishedTime: isArticle && options.publishedTime ? toUtcDate(options.publishedTime).toISOString() : undefined,
      modifiedTime: isArticle && options.modifiedTime ? toUtcDate(options.modifiedTime).toISOString() : undefined,
    }
  })

  useHead({
    link: [{ rel: 'canonical', href: () => seo.value.url }],
  })

  useSeoMeta({
    title: () => seo.value.title,
    description: () => seo.value.description,
    robots: () => (seo.value.noindex ? 'noindex, follow' : 'index, follow'),
    ogType: () => seo.value.type ?? 'website',
    ogSiteName: siteConfig.name,
    ogLocale: siteConfig.locale.replace('-', '_'),
    ogTitle: () => seo.value.title,
    ogDescription: () => seo.value.description,
    ogUrl: () => seo.value.url,
    ogImage: () => seo.value.image,
    ogImageAlt: () => seo.value.title,
    articlePublishedTime: () => seo.value.publishedTime,
    articleModifiedTime: () => seo.value.modifiedTime,
    articleAuthor: () => (seo.value.type === 'article' ? [siteConfig.author.name] : undefined),
    articleSection: () => seo.value.section,
    articleTag: () => seo.value.tags,
    twitterCard: 'summary_large_image',
    twitterSite: siteConfig.twitterHandle || undefined,
    twitterTitle: () => seo.value.title,
    twitterDescription: () => seo.value.description,
    twitterImage: () => seo.value.image,
  })
}
