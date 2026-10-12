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
  <div class="container-page py-12">
    <PageHeader
      title="分类"
      :description="`共 ${categories.length} 个分类。`"
    />
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="category in categories"
        :key="category.slug"
      >
        <NuxtLink
          :to="`/categories/${category.slug}`"
          class="flex h-full flex-col rounded-lg border border-border p-5 transition-colors hover:border-border-strong hover:bg-surface"
        >
          <span class="flex items-baseline justify-between gap-3">
            <span class="font-semibold">{{ category.name }}</span>
            <span class="font-mono text-xs text-subtle">{{ category.count }} 篇</span>
          </span>
          <span
            v-if="siteConfig.categoryDescriptions[category.name]"
            class="mt-2 text-sm leading-relaxed text-muted"
          >
            {{ siteConfig.categoryDescriptions[category.name] }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
