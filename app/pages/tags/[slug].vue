<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)

const { data: posts } = await usePostList()
const tag = computed(() => collectTags(posts.value).find(item => item.slug === slug))

if (!tag.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tag Not Found', fatal: true })
}

const tagPosts = computed(() => filterByTag(posts.value, slug))

usePageSeo(() => ({
  title: `${tag.value!.name} 标签`,
  description: `标签「${tag.value!.name}」下的全部文章。`,
  path: `/tags/${slug}`,
}))
</script>

<template>
  <div class="container-narrow page-shell">
    <PageHeader
      :title="tag!.name"
      :description="`关于 ${tag!.name} 的 ${tagPosts.length} 篇技术笔记，按发布时间倒序排列。`"
    >
      <NuxtLink
        to="/tags"
        class="text-link mt-5 inline-flex min-h-11 items-center gap-2 text-sm"
      >
        <span aria-hidden="true">←</span> 全部标签
      </NuxtLink>
    </PageHeader>
    <PostList :posts="tagPosts" />
  </div>
</template>
