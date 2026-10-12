<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const HOME_TAG_COUNT = 16

const { data: posts } = await usePostList()
const { siteUrl } = useRuntimeConfig().public

const latestPosts = computed(() => posts.value.slice(0, siteConfig.homeLatestCount))
const categories = computed(() => collectCategories(posts.value).slice(0, siteConfig.homeCategoryCount))
const tags = computed(() => collectTags(posts.value).slice(0, HOME_TAG_COUNT))

usePageSeo({ path: '/' })

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteConfig.name,
      'description': siteConfig.description,
      'url': absoluteUrl(siteUrl, '/'),
      'inLanguage': siteConfig.locale,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${absoluteUrl(siteUrl, '/search')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  }],
})
</script>

<template>
  <div class="container-page">
    <section class="border-b border-border py-14 sm:py-20">
      <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
        {{ siteConfig.name }}
      </h1>
      <p class="mt-4 font-mono text-sm text-muted sm:text-base">
        {{ siteConfig.tagline }}
      </p>
      <p class="mt-5 max-w-xl text-lg leading-relaxed text-muted">
        {{ siteConfig.description }}
      </p>
    </section>

    <div class="grid gap-14 py-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
      <section aria-labelledby="latest-posts">
        <div class="mb-8 flex items-baseline justify-between">
          <h2
            id="latest-posts"
            class="text-sm font-semibold uppercase tracking-wider text-subtle"
          >
            最新文章
          </h2>
          <NuxtLink
            to="/posts"
            class="link-muted text-sm"
          >
            全部文章 →
          </NuxtLink>
        </div>
        <PostList
          :posts="latestPosts"
          heading-tag="h3"
        />
        <p
          v-if="!latestPosts.length"
          class="text-muted"
        >
          暂无文章。
        </p>
      </section>

      <aside class="space-y-10">
        <section
          v-if="categories.length"
          aria-labelledby="popular-categories"
        >
          <div class="mb-4 flex items-baseline justify-between">
            <h2
              id="popular-categories"
              class="text-sm font-semibold uppercase tracking-wider text-subtle"
            >
              热门分类
            </h2>
            <NuxtLink
              to="/categories"
              class="link-muted text-sm"
            >
              全部 →
            </NuxtLink>
          </div>
          <ul class="divide-y divide-border rounded-lg border border-border">
            <li
              v-for="category in categories"
              :key="category.slug"
            >
              <NuxtLink
                :to="`/categories/${category.slug}`"
                class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-surface"
              >
                <span>{{ category.name }}</span>
                <span class="font-mono text-xs text-subtle">{{ category.count }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section
          v-if="tags.length"
          aria-labelledby="popular-tags"
        >
          <div class="mb-4 flex items-baseline justify-between">
            <h2
              id="popular-tags"
              class="text-sm font-semibold uppercase tracking-wider text-subtle"
            >
              常用标签
            </h2>
            <NuxtLink
              to="/tags"
              class="link-muted text-sm"
            >
              全部 →
            </NuxtLink>
          </div>
          <PostTags :tags="tags.map(tag => tag.name)" />
        </section>
      </aside>
    </div>
  </div>
</template>
