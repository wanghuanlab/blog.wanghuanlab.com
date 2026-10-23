<script setup lang="ts">
const LANGUAGE_LABELS: Record<string, string> = {
  java: 'Java',
  kotlin: 'Kotlin',
  xml: 'XML',
  properties: 'Properties',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Shell',
  powershell: 'PowerShell',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  json: 'JSON',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
  py: 'Python',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  nginx: 'Nginx',
  md: 'Markdown',
  markdown: 'Markdown',
  diff: 'Diff',
}

const COPY_FEEDBACK_MS = 2500

const props = withDefaults(defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  highlights?: number[]
  meta?: string | null
  class?: string | null
}>(), {
  code: '',
  language: null,
  filename: null,
  highlights: () => [],
  meta: null,
  class: null,
})

const label = computed(() => {
  if (props.filename) return props.filename
  if (!props.language) return 'Text'
  return LANGUAGE_LABELS[props.language.toLowerCase()] ?? props.language
})

const copyState = ref<'idle' | 'copying' | 'copied' | 'error'>('idle')
const copyLabel = computed(() => ({ idle: '复制', copying: '复制中', copied: '已复制', error: '复制失败，请重试' })[copyState.value])
let resetTimer: ReturnType<typeof setTimeout> | undefined
let isUnmounted = false

async function copy() {
  if (copyState.value === 'copying') return
  clearTimeout(resetTimer)
  copyState.value = 'copying'
  try {
    await navigator.clipboard.writeText(props.code)
    if (isUnmounted) return
    copyState.value = 'copied'
  }
  catch {
    if (isUnmounted) return
    copyState.value = 'error'
  }
  resetTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, COPY_FEEDBACK_MS)
}

onBeforeUnmount(() => {
  isUnmounted = true
  clearTimeout(resetTimer)
})
</script>

<template>
  <div class="code-block">
    <div class="code-block__header">
      <span class="min-w-0 break-all">{{ label }}</span>
      <button
        type="button"
        class="code-block__copy"
        :aria-label="copyState === 'error' ? '复制失败，点击重试' : `复制 ${label} 代码`"
        :disabled="copyState === 'copying'"
        @click="copy"
      >
        <AppIcon
          :name="copyState === 'copied' ? 'check' : 'copy'"
          :size="14"
        />
        <span role="status">{{ copyLabel }}</span>
      </button>
    </div>
    <pre
      :class="props.class"
      tabindex="0"
      :aria-label="`${label} 代码，可横向滚动`"
    ><slot /></pre>
  </div>
</template>
