<script setup lang="ts">
const { data: posts } = await usePostList()
const tags = computed(() => collectTags(posts.value))

usePageSeo({
  title: '标签',
  description: '按标签浏览全部技术文章。',
  path: '/tags',
})
</script>

<template>
  <div class="container-page py-12">
    <PageHeader
      title="标签"
      :description="`共 ${tags.length} 个标签。`"
    />
    <TermChips
      :terms="tags"
      base-path="/tags"
      show-count
    />
  </div>
</template>
