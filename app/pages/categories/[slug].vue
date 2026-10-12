<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const route = useRoute()
const slug = String(route.params.slug)

const { data: posts } = await usePostList()
const category = computed(() => collectCategories(posts.value).find(item => item.slug === slug))

if (!category.value) {
  throw createError({ status: 404, statusText: 'Category Not Found', fatal: true })
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
  <div class="container-narrow py-12">
    <PageHeader
      eyebrow="Category"
      :title="category!.name"
      :description="`${description} 共 ${categoryPosts.length} 篇。`"
    />
    <PostList :posts="categoryPosts" />
  </div>
</template>
