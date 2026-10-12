<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const route = useRoute()
const { open: openSearch } = useSearchDialog()

const isNotFound = computed(() => props.error.status === 404)
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
    <section class="container-narrow flex min-h-[60vh] flex-col justify-center py-20">
      <p class="font-mono text-sm text-subtle">
        {{ error.status }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {{ title }}
      </h1>
      <p class="mt-4 leading-relaxed text-muted">
        <template v-if="isNotFound">
          你访问的地址 <code class="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">{{ route.path }}</code> 不存在，可能已被移动或删除。
        </template>
        <template v-else>
          服务暂时出现问题，请稍后刷新重试。
        </template>
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-md bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          @click="goHome"
        >
          返回首页
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm transition-colors hover:bg-surface"
          @click="openSearch"
        >
          <AppIcon
            name="search"
            :size="15"
          />
          搜索文章
        </button>
        <NuxtLink
          to="/posts"
          class="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted transition-colors hover:text-fg"
        >
          浏览全部文章 →
        </NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>
