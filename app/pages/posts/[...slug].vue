<script setup lang="ts">
import { siteConfig } from '~~/config/site'
import type { TocItem } from '~/components/post/PostToc.vue'

const route = useRoute()
const path = normalizePath(route.path)
const { siteUrl } = useRuntimeConfig().public

const [{ data: post }, { data: posts }] = await Promise.all([
  useAsyncData(`post:${path}`, () => queryCollection('posts')
    .path(path)
    .where('draft', '=', false)
    .first()),
  usePostList(),
])

if (!post.value) {
  throw createError({ status: 404, statusText: 'Post Not Found', fatal: true })
}

const article = computed(() => post.value!)
const tags = computed(() => article.value.tags ?? [])
const readingTime = computed(() => article.value.readingTime ?? 1)
const tocLinks = computed<TocItem[]>(() => article.value.body?.toc?.links ?? [])
const headingIds = computed(() => {
  const collect = (items: TocItem[]): string[] => items.flatMap(item => [item.id, ...collect(item.children ?? [])])
  return collect(tocLinks.value)
})
const activeId = useActiveHeading(headingIds)
const mobileToc = useTemplateRef<HTMLDetailsElement>('mobileToc')

const index = computed(() => posts.value.findIndex(item => item.path === article.value.path))
const previous = computed(() => (index.value >= 0 ? posts.value[index.value + 1] : undefined))
const next = computed(() => (index.value > 0 ? posts.value[index.value - 1] : undefined))
const related = computed(() => findRelatedPosts(article.value, posts.value, siteConfig.relatedPostCount))

function closeMobileToc() {
  if (mobileToc.value) mobileToc.value.open = false
}

usePageSeo(() => ({
  title: article.value.title,
  description: article.value.description,
  path: article.value.path,
  type: 'article',
  image: article.value.cover,
  publishedTime: article.value.date,
  modifiedTime: article.value.updated ?? article.value.date,
  section: article.value.category,
  tags: tags.value,
}))

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': article.value.title,
      'description': article.value.description,
      'datePublished': article.value.date,
      'dateModified': article.value.updated ?? article.value.date,
      'author': { '@type': 'Person', 'name': siteConfig.author.name },
      'publisher': { '@type': 'Organization', 'name': siteConfig.name },
      'mainEntityOfPage': absoluteUrl(siteUrl, article.value.path),
      'image': absoluteUrl(siteUrl, article.value.cover ?? siteConfig.ogImage),
      'articleSection': article.value.category,
      'keywords': tags.value.join(', '),
      'inLanguage': siteConfig.locale,
    }),
  }],
})
</script>

<template>
  <div class="container-page article-page">
    <div class="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-14">
      <article class="mx-auto w-full min-w-0 max-w-[760px]">
        <header class="article-header">
          <NuxtLink
            to="/posts"
            class="article-back"
          >
            <AppIcon
              name="arrow-left"
              :size="15"
            />
            全部文章
          </NuxtLink>
          <h1 class="article-title">
            {{ article.title }}
          </h1>
          <p
            v-if="article.description"
            class="article-description"
          >
            {{ article.description }}
          </p>
          <PostMeta
            class="mt-6"
            :date="article.date"
            :updated="article.updated"
            :category="article.category"
            :reading-time="readingTime"
          />
          <PostTags
            class="mt-4"
            :tags="tags"
          />
        </header>

        <details
          v-if="tocLinks.length"
          ref="mobileToc"
          class="group mb-10 rounded bg-surface px-4 xl:hidden"
        >
          <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span class="inline-flex items-center gap-2">
              <AppIcon
                name="list"
                :size="16"
              />
              文章目录
            </span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="text-subtle transition-transform group-open:rotate-180"
            />
          </summary>
          <div class="max-h-[50vh] overflow-y-auto pb-4 pt-1">
            <PostToc
              :links="tocLinks"
              :active-id="activeId"
              @select="closeMobileToc"
            />
          </div>
        </details>

        <ContentRenderer
          :value="article"
          class="prose"
        />

        <footer class="mt-16 space-y-12 pt-4 sm:mt-20">
          <PostPager
            :previous="previous"
            :next="next"
          />
          <PostRelated :posts="related" />
        </footer>
      </article>

      <aside
        v-if="tocLinks.length"
        class="hidden xl:block"
        aria-label="文章目录"
      >
        <div class="sticky top-[calc(var(--header-h)+2rem)] max-h-[calc(100dvh-var(--header-h)-4rem)] overflow-y-auto overscroll-contain pr-2">
          <p class="mb-4 text-[13px] font-medium text-subtle">
            本文目录
          </p>
          <PostToc
            :links="tocLinks"
            :active-id="activeId"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.article-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.article-header {
  margin-bottom: 2.75rem;
}

.article-back {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.8125rem;
  transition: color 150ms;
}

.article-back:hover {
  color: var(--accent);
}

.article-title {
  margin-top: 1rem;
  overflow-wrap: anywhere;
  color: var(--fg);
  font-size: clamp(2rem, 3.6vw, 3rem);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1.3;
  text-wrap: pretty;
}

.article-description {
  margin-top: 1.5rem;
  color: var(--muted);
  font-size: 1.0625rem;
  line-height: 1.85;
}

@media (min-width: 768px) {
  .article-page {
    padding-top: 3rem;
    padding-bottom: 7rem;
  }

  .article-header {
    margin-bottom: 3.5rem;
  }

  .article-description {
    font-size: 1.125rem;
  }
}
</style>
