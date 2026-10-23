<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const HOME_TAG_COUNT = 16

const { data: posts } = await usePostList()
const { siteUrl } = useRuntimeConfig().public

const latestPosts = computed(() => posts.value.slice(0, siteConfig.homeLatestCount))
const featuredPost = computed(() => latestPosts.value[0])
const remainingPosts = computed(() => latestPosts.value.slice(1))
const allCategories = computed(() => collectCategories(posts.value))
const introTopics = computed(() => allCategories.value.slice(0, 3))
const { open: openSearch } = useSearchDialog()
const categories = computed(() => allCategories.value.slice(0, siteConfig.homeCategoryCount))
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
    <section
      class="home-intro"
      aria-labelledby="home-heading"
    >
      <div class="intro-copy">
        <h1
          id="home-heading"
          class="home-title"
        >
          {{ siteConfig.homeTitle }}
        </h1>
        <p class="home-description">
          {{ siteConfig.homeDescription }}
        </p>
        <ul
          v-if="introTopics.length"
          class="intro-topics"
          aria-label="快速浏览热门主题"
        >
          <li
            v-for="topic in introTopics"
            :key="topic.slug"
          >
            <NuxtLink
              :to="`/categories/${topic.slug}`"
              class="intro-topic-link"
            >{{ topic.name }}</NuxtLink>
          </li>
        </ul>
      </div>
      <div class="intro-actions">
        <NuxtLink
          to="/posts"
          class="button-primary"
        >
          浏览文章 <AppIcon
            name="arrow-right"
            :size="17"
          />
        </NuxtLink>
        <button
          type="button"
          class="text-link"
          aria-haspopup="dialog"
          @click="openSearch"
        >
          <AppIcon
            name="search"
            :size="17"
          /> 搜索内容
        </button>
      </div>
    </section>

    <div class="home-columns">
      <section
        aria-labelledby="latest-posts"
        class="min-w-0"
      >
        <div class="section-top">
          <h2
            id="latest-posts"
            class="section-heading"
          >
            最近文章
          </h2>
          <NuxtLink
            to="/posts"
            class="text-link"
          >全部文章</NuxtLink>
        </div>
        <article
          v-if="featuredPost"
          class="featured-post"
        >
          <PostMeta
            :date="featuredPost.date"
            :category="featuredPost.category"
            :reading-time="featuredPost.readingTime"
          />
          <h3 class="featured-title">
            <NuxtLink :to="featuredPost.path">{{ featuredPost.title }}</NuxtLink>
          </h3>
          <p class="featured-description">
            {{ featuredPost.description }}
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-x-2">
            <PostTags :tags="featuredPost.tags.slice(0, 3)" />
            <span
              v-if="featuredPost.tags.length > 3"
              class="text-[13px] text-subtle"
            >另 {{ featuredPost.tags.length - 3 }} 个标签</span>
          </div>
          <NuxtLink
            :to="featuredPost.path"
            class="text-link mt-3"
            :aria-label="`阅读全文：${featuredPost.title}`"
          >阅读全文</NuxtLink>
        </article>
        <PostList
          v-if="remainingPosts.length"
          :posts="remainingPosts"
          heading-tag="h3"
          class="mt-12"
        />
        <p
          v-if="!latestPosts.length"
          class="empty-state"
        >
          文章正在准备中，稍后再来看看。
        </p>
        <NuxtLink
          v-if="latestPosts.length"
          to="/posts"
          class="text-link mt-10"
        >浏览全部 {{ posts.length }} 篇文章 <AppIcon
          name="arrow-right"
          :size="17"
        /></NuxtLink>
      </section>

      <aside class="home-aside">
        <section
          v-if="categories.length"
          aria-labelledby="browse-topics"
        >
          <div class="section-top">
            <h2
              id="browse-topics"
              class="aside-heading"
            >
              按主题探索
            </h2>
            <NuxtLink
              to="/categories"
              class="text-link"
            >全部</NuxtLink>
          </div>
          <ul class="topic-list">
            <li
              v-for="category in categories"
              :key="category.slug"
            >
              <NuxtLink
                :to="`/categories/${category.slug}`"
                class="topic-link"
              >
                <span>
                  <span class="topic-name">{{ category.name }}</span>
                  <span
                    v-if="siteConfig.categoryDescriptions[category.name]"
                    class="topic-description"
                  >{{ siteConfig.categoryDescriptions[category.name] }}</span>
                </span>
                <span class="topic-count">{{ category.count }}<span class="sr-only"> 篇文章</span></span>
              </NuxtLink>
            </li>
          </ul>
        </section>
        <section
          v-if="tags.length"
          aria-labelledby="popular-tags"
          class="aside-tags"
        >
          <div class="section-top">
            <h2
              id="popular-tags"
              class="aside-heading"
            >
              常用标签
            </h2>
            <NuxtLink
              to="/tags"
              class="text-link"
            >全部</NuxtLink>
          </div>
          <PostTags :tags="tags.map(tag => tag.name)" />
        </section>
        <section
          class="rss-note"
          aria-labelledby="follow-updates"
        >
          <AppIcon
            name="rss"
            :size="22"
            class="text-accent"
          />
          <h2
            id="follow-updates"
            class="aside-heading mt-4"
          >
            跟上新的思考
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            通过 RSS 订阅新文章，在你习惯的阅读器中继续阅读。
          </p>
          <a
            href="/rss.xml"
            class="text-link mt-3"
          >订阅 RSS <AppIcon
            name="arrow-right"
            :size="16"
          /></a>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.home-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: clamp(2rem, 4vw, 3rem) 0 clamp(2.5rem, 4vw, 3.5rem);
}
.intro-copy {
  min-width: 0;
}
.home-title {
  font-size: clamp(1.625rem, 3.3vw, 2.375rem);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1.4;
}
.home-description {
  max-width: 42rem;
  margin-top: 0.75rem;
  color: var(--muted);
  font-size: var(--text-body);
  line-height: 1.8;
}
.intro-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1.5rem;
  margin-top: 0.5rem;
}
.intro-topic-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--accent);
  font-size: var(--text-small);
  text-underline-offset: 0.25em;
}
.intro-topic-link:hover {
  text-decoration: underline;
}
.intro-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 1.5rem;
}
.home-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17rem;
  gap: clamp(2rem, 5vw, 4.5rem);
}
.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.featured-post {
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--surface);
  border-radius: var(--radius);
}
.featured-title {
  margin-top: 1rem;
  font-size: clamp(1.35rem, 2.35vw, 1.875rem);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1.5;
}
.featured-title a {
  transition: color var(--duration);
}
.featured-title a:hover {
  color: var(--accent);
}
.featured-description {
  display: -webkit-box;
  max-width: 60ch;
  overflow: hidden;
  margin-top: 1rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.85;
}
.aside-heading {
  font-size: var(--text-lead);
  font-weight: 650;
  letter-spacing: -0.025em;
}
.topic-list {
  display: grid;
  gap: 1rem;
}
.topic-link {
  display: flex;
  min-height: 44px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem 0;
}
.topic-name {
  display: block;
  font-size: 1rem;
  font-weight: 550;
  transition: color var(--duration);
}
.topic-link:hover .topic-name {
  color: var(--accent);
}
.topic-description {
  display: block;
  margin-top: 0.3rem;
  color: var(--subtle);
  font-size: var(--text-caption);
  line-height: 1.7;
}
.topic-count {
  min-width: 1.5rem;
  margin-top: 0.125rem;
  color: var(--subtle);
  font-size: 0.875rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.aside-tags {
  margin-top: 3rem;
}
.rss-note {
  margin-top: 2.5rem;
  padding: 1.5rem;
  background: var(--accent-soft);
  border-radius: var(--radius);
}
@media (max-width: 1023px) {
  .home-columns {
    grid-template-columns: minmax(0, 1fr);
    gap: 3.5rem;
  }
  .home-aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  .aside-tags {
    margin-top: 0;
  }
  .rss-note {
    margin-top: 0;
  }
}
@media (max-width: 639px) {
  .home-intro {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-top: 1.5rem;
    padding-bottom: 2.25rem;
  }
  .home-aside {
    grid-template-columns: minmax(0, 1fr);
  }
  .featured-title {
    font-size: 1.375rem;
  }
}
</style>
