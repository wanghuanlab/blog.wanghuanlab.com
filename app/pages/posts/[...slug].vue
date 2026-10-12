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
  <div class="container-page py-10 sm:py-14">
    <div class="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-12">
      <article class="mx-auto w-full min-w-0 max-w-[760px]">
        <header class="mb-10">
          <NuxtLink
            :to="`/categories/${slugify(article.category)}`"
            class="font-mono text-xs uppercase tracking-wider text-accent hover:underline"
          >
            {{ article.category }}
          </NuxtLink>
          <h1 class="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {{ article.title }}
          </h1>
          <p
            v-if="article.description"
            class="mt-4 text-lg leading-relaxed text-muted"
          >
            {{ article.description }}
          </p>
          <PostMeta
            class="mt-5"
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
          class="group mb-10 rounded-lg border border-border xl:hidden"
        >
          <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span class="inline-flex items-center gap-2">
              <AppIcon
                name="list"
                :size="16"
              />
              目录
            </span>
            <AppIcon
              name="chevron-down"
              :size="16"
              class="text-subtle transition-transform group-open:rotate-180"
            />
          </summary>
          <div class="max-h-[50vh] overflow-y-auto border-t border-border px-4 py-3">
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

        <footer class="mt-16 space-y-10 border-t border-border pt-8">
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
        <div class="sticky top-[calc(var(--header-h)+2.5rem)] max-h-[calc(100dvh-var(--header-h)-4rem)] overflow-y-auto">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
            目录
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
