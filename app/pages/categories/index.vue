<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const { data: posts } = await usePostList()
const categories = computed(() => collectCategories(posts.value))

usePageSeo({
  title: '分类',
  description: '按技术领域浏览文章：Java、Spring、数据库、大数据、AI、前端、DevOps 与架构设计。',
  path: '/categories',
})
</script>

<template>
  <div class="container-page page-shell">
    <PageHeader
      title="分类"
      :description="`从具体问题出发，沿着主题深入阅读。共 ${categories.length} 个分类，${posts.length} 篇文章。`"
    />
    <ul
      v-if="categories.length"
      class="category-index"
    >
      <li
        v-for="category in categories"
        :key="category.slug"
      >
        <NuxtLink
          :to="`/categories/${category.slug}`"
          class="category-link"
        >
          <span class="category-heading">
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.count }} 篇</span>
          </span>
          <span
            class="category-description"
          >
            {{ siteConfig.categoryDescriptions[category.name] ?? `关于 ${category.name} 的技术笔记与工程实践。` }}
          </span>
          <span class="category-action">浏览文章</span>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="py-8 text-muted"
    >
      文章发布后，会在这里按技术领域归类。
    </p>
  </div>
</template>

<style scoped>
.category-index {
  display: grid;
  row-gap: 0.5rem;
  column-gap: clamp(2rem, 6vw, 5rem);
  margin-inline: -1rem;
}

.category-link {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 1.6rem 1rem 1.8rem;
  transition: background-color 160ms ease;
}

.category-link:hover {
  background-color: var(--surface);
}

.category-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.category-name {
  font-size: clamp(1.4rem, 2.4vw, 1.8rem);
  font-weight: 600;
  letter-spacing: -0.035em;
  transition: color 160ms ease;
}

.category-count {
  flex-shrink: 0;
  color: var(--subtle);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.category-description {
  max-width: 32rem;
  margin-top: 0.65rem;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.8;
}

.category-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1.4rem;
  color: var(--muted);
  font-size: 0.8125rem;
}

.category-link:hover .category-name,
.category-link:hover .category-action {
  color: var(--accent);
}

@media (min-width: 640px) {
  .category-index {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
