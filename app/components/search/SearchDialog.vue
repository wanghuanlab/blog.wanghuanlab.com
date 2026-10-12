<script setup lang="ts">
const { isOpen, close, toggle } = useSearchDialog()
const route = useRoute()
const query = ref('')
let previousFocus: HTMLElement | null = null

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    toggle()
  }
}

watch(isOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  else {
    previousFocus?.focus()
    previousFocus = null
  }
})

watch(() => route.fullPath, close)

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 pt-[8vh] backdrop-blur-[2px] sm:p-6 sm:pt-[12vh]"
      @mousedown.self="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="站内搜索"
        class="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl"
        @keydown.tab.prevent
      >
        <SearchPanel
          v-model:query="query"
          autofocus
          show-key-hints
          @navigate="close"
          @escape="close"
        />
      </div>
    </div>
  </Teleport>
</template>
