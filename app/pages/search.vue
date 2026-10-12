<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const query = ref('')

onMounted(() => {
  if (typeof route.query.q === 'string') query.value = route.query.q
})

watch(query, (value) => {
  router.replace({ query: value ? { q: value } : {} })
})

usePageSeo({
  title: '搜索',
  description: '搜索全部文章的标题、摘要、正文、分类与标签。',
  path: '/search',
  noindex: true,
})
</script>

<template>
  <div class="container-narrow py-12">
    <PageHeader
      title="搜索"
      description="基于本地索引，支持搜索标题、摘要、正文、分类与标签。任意页面可按 ⌘ K / Ctrl K 快速打开。"
    />
    <div class="overflow-hidden rounded-xl border border-border">
      <SearchPanel
        v-model:query="query"
        autofocus
      />
    </div>
  </div>
</template>
