<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const query = ref('')
let updateTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (typeof route.query.q === 'string') query.value = route.query.q
})

watch(() => route.query.q, (value) => {
  const next = typeof value === 'string' ? value : ''
  if (query.value !== next) query.value = next
})

watch(query, (value) => {
  clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    if (value === (typeof route.query.q === 'string' ? route.query.q : '')) return
    router.replace({ query: { ...route.query, q: value || undefined } })
  }, 200)
})

onBeforeUnmount(() => clearTimeout(updateTimer))

usePageSeo({
  title: '搜索',
  description: '搜索全部文章的标题、摘要、正文、分类与标签。',
  path: '/search',
  noindex: true,
})
</script>

<template>
  <div class="container-narrow search-page">
    <PageHeader
      title="搜索"
      description="在文章中寻找答案。搜索标题、正文、分类与标签，用关键词连接你的问题与实践。"
    />
    <div class="search-page-panel">
      <SearchPanel
        v-model:query="query"
        autofocus
      />
    </div>
    <p class="search-page-shortcut">
      在任意页面按 <kbd>⌘ K</kbd> 或 <kbd>Ctrl K</kbd>，随时开始搜索。
    </p>
  </div>
</template>

<style scoped>
.search-page { padding-top: 64px; padding-bottom: 80px; }

.search-page-panel {
  overflow: hidden;
  border-top: 2px solid var(--fg);
  background: var(--elevated);
}

.search-page-shortcut { margin-top: 24px; color: var(--muted); font-size: 13px; line-height: 1.9; }

@media (max-width: 640px) {
  .search-page { padding-top: 40px; padding-bottom: 56px; }
}
</style>
