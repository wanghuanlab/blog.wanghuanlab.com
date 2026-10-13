<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  title?: string
  fallbackImg?: string
  height?: string | number
}>(), {
  title: '交互式架构图',
  fallbackImg: '',
  height: 520,
})

const colorMode = useColorMode()
const isLoaded = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)

const embedSrc = computed(() => {
  const theme = colorMode.value === 'dark' ? 'dark' : 'light'
  const separator = props.src.includes('?') ? '&' : '?'
  return `${props.src}${separator}embed=1&theme=${theme}`
})

const heightStyle = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})
</script>

<template>
  <div class="my-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden shadow-sm">
    <!-- 顶部状态与操作栏 -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-gray-100/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
          Archify 交互图
        </span>
        <span class="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[260px] sm:max-w-md">
          {{ title }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="hidden sm:inline-block text-[11px] text-gray-400 dark:text-gray-500">
          支持缩放与节点探索
        </span>
        <a
          :href="src"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-600 transition-colors shadow-xs"
          title="在新标签页全屏打开"
        >
          <span>全屏打开</span>
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>

    <!-- 交互式 iframe 容器 -->
    <div
      class="relative w-full bg-white dark:bg-[#0d1117]"
      :style="{ height: heightStyle }"
    >
      <iframe
        ref="iframeRef"
        :src="embedSrc"
        :title="title"
        class="w-full h-full border-0"
        loading="lazy"
        allow="clipboard-write"
        @load="isLoaded = true"
      />
    </div>
  </div>
</template>
