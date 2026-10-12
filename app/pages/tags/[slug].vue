<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)

const { data: posts } = await usePostList()
const tag = computed(() => collectTags(posts.value).find(item => item.slug === slug))

if (!tag.value) {
  throw createError({ status: 404, statusText: 'Tag Not Found', fatal: true })
}

const tagPosts = computed(() => filterByTag(posts.value, slug))

usePageSeo(() => ({
  title: `${tag.value!.name} 标签`,
  description: `标签「${tag.value!.name}」下的全部文章。`,
  path: `/tags/${slug}`,
}))
</script>

<template>
  <div class="container-narrow py-12">
    <PageHeader
      eyebrow="Tag"
      :title="`# ${tag!.name}`"
      :description="`共 ${tagPosts.length} 篇文章。`"
    />
    <PostList :posts="tagPosts" />
  </div>
</template>
