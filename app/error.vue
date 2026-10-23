<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const route = useRoute()
const { open: openSearch } = useSearchDialog()

const statusCode = computed(() => Number(props.error.statusCode ?? props.error.status ?? 500))
const isNotFound = computed(() => statusCode.value === 404)
const title = computed(() => (isNotFound.value ? '页面不存在' : '页面出错了'))

usePageSeo(() => ({
  title: title.value,
  description: isNotFound.value ? '你访问的页面不存在或已被移动。' : '服务暂时不可用，请稍后重试。',
  path: route.path,
  noindex: true,
}))

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <section class="container-narrow page-shell error-page">
      <PageHeader
        :title="title"
      />
      <p class="error-description">
        <template v-if="isNotFound">
          这个地址暂时没有内容，可能已被移动或删除。可以返回首页，或搜索你感兴趣的话题。
        </template>
        <template v-else>
          服务暂时出现问题，请稍后刷新重试。
        </template>
      </p>
      <p
        v-if="isNotFound"
        class="error-path"
      >
        <span class="sr-only">当前地址：</span>{{ route.path }}
      </p>
      <div class="error-actions">
        <button
          type="button"
          class="button-primary"
          @click="goHome"
        >
          返回首页
        </button>
        <button
          type="button"
          class="button-secondary"
          @click="openSearch"
        >
          搜索文章
        </button>
        <NuxtLink
          to="/posts"
          class="text-link inline-flex min-h-11 items-center gap-2 px-2 text-sm"
        >
          浏览全部文章 <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.error-page {
  display: flex;
  min-height: 65vh;
  flex-direction: column;
  justify-content: center;
}

.error-page :deep(.page-header) {
  margin-bottom: 1.5rem;
}

.error-description {
  max-width: 30rem;
  color: var(--muted);
  line-height: 1.9;
}

.error-path {
  margin-top: 1rem;
  color: var(--subtle);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.error-actions > :is(button, a) {
  min-height: 2.75rem;
}
</style>
