<script setup lang="ts">
const { data: posts } = await usePostList()
const categories = computed(() => collectCategories(posts.value))

usePageSeo({
  title: '全部文章',
  description: '全部技术文章列表，涵盖 Java、Spring、数据库、大数据、AI、前端与 DevOps 等主题。',
  path: '/posts',
})
</script>

<template>
  <div class="container-narrow py-12">
    <PageHeader
      title="全部文章"
      :description="`共 ${posts.length} 篇文章，按发布时间倒序排列。`"
    >
      <TermChips
        v-if="categories.length"
        class="mt-6"
        :terms="categories"
        base-path="/categories"
        show-count
      />
    </PageHeader>
    <PostList :posts="posts" />
  </div>
</template>
