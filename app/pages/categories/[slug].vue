<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const route = useRoute()
const slug = String(route.params.slug)

const { data: posts } = await usePostList()
const category = computed(() => collectCategories(posts.value).find(item => item.slug === slug))

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category Not Found', fatal: true })
}

const categoryPosts = computed(() => filterByCategory(posts.value, slug))
const description = computed(() => siteConfig.categoryDescriptions[category.value!.name]
  ?? `${category.value!.name} 分类下的全部文章。`)

usePageSeo(() => ({
  title: `${category.value!.name} 分类`,
  description: description.value,
  path: `/categories/${slug}`,
}))
</script>

<template>
  <div class="container-narrow page-shell">
    <PageHeader
      :title="category!.name"
      :description="`${description} 共 ${categoryPosts.length} 篇。`"
    >
      <NuxtLink
        to="/categories"
        class="text-link mt-5 inline-flex min-h-11 items-center gap-2 text-sm"
      >
        <span aria-hidden="true">←</span> 全部分类
      </NuxtLink>
    </PageHeader>
    <PostList :posts="categoryPosts" />
  </div>
</template>
