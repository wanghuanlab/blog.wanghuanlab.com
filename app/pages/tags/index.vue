<script setup lang="ts">
import { compareTermNames } from '#shared/utils/taxonomy'

const { data: posts } = await usePostList()
const tags = computed(() => collectTags(posts.value))
const sortedTags = computed(() => [...tags.value].sort(compareTermNames))

usePageSeo({
  title: '标签',
  description: '按标签浏览全部技术文章。',
  path: '/tags',
})
</script>

<template>
  <div class="container-page page-shell">
    <PageHeader
      title="标签"
      :description="`在不同技术领域之间，找到感兴趣的具体话题。共 ${tags.length} 个标签，按名称排列。`"
    />
    <ul
      v-if="sortedTags.length"
      class="tag-index"
    >
      <li
        v-for="tag in sortedTags"
        :key="tag.slug"
      >
        <NuxtLink
          :to="`/tags/${tag.slug}`"
          class="tag-link"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }} <span class="sr-only">篇文章</span></span>
        </NuxtLink>
      </li>
    </ul>
    <p
      v-else
      class="py-8 text-muted"
    >
      文章中的技术话题，会在这里汇成标签索引。
    </p>
  </div>
</template>

<style scoped>
.tag-index {
  display: grid;
  column-gap: clamp(2rem, 5vw, 4rem);
  margin-inline: -0.75rem;
}

.tag-link {
  display: flex;
  min-height: 3.75rem;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 0.75rem;
  transition: color 160ms ease, background-color 160ms ease;
}

.tag-link:hover {
  background-color: var(--surface);
  color: var(--accent);
}

.tag-name {
  overflow-wrap: anywhere;
  font-size: 1rem;
  line-height: 1.6;
}

.tag-count {
  flex-shrink: 0;
  color: var(--subtle);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 540px) {
  .tag-index {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .tag-index {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
