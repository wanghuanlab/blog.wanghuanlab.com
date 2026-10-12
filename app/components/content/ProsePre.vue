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

const COPIED_RESET_MS = 2000

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

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, COPIED_RESET_MS)
  }
  catch {
    copied.value = false
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <div class="code-block">
    <div class="code-block__header">
      <span class="truncate">{{ label }}</span>
      <button
        type="button"
        class="inline-flex h-7 items-center gap-1.5 rounded px-2 transition-colors hover:bg-bg hover:text-fg"
        title="复制代码"
        @click="copy"
      >
        <AppIcon
          :name="copied ? 'check' : 'copy'"
          :size="14"
        />
        <span aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>
    <pre :class="props.class"><slot /></pre>
  </div>
</template>
