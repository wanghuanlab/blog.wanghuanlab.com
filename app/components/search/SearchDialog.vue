<script setup lang="ts">
const { isOpen, close, toggle } = useSearchDialog()
const route = useRoute()
const query = ref('')
const dialog = useTemplateRef<HTMLElement>('dialog')
const titleId = useId()
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
let background: HTMLElement | null = null
let previousInert = false
let locked = false

function unlock() {
  if (!locked) return
  document.documentElement.style.overflow = previousOverflow
  if (background) background.inert = previousInert
  background = null
  locked = false
  const target = previousFocus
  previousFocus = null
  nextTick(() => {
    if (target?.isConnected) target.focus({ preventScroll: true })
  })
}

function lock() {
  if (locked) return
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  background = document.getElementById('__nuxt')
  previousInert = background?.inert ?? false
  if (background) background.inert = true
  locked = true
  nextTick(() => dialog.value?.querySelector<HTMLInputElement>('input[type="search"]')?.focus())
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    toggle()
  }
}

function onDialogKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = [...(dialog.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
  ) ?? [])].filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) {
    event.preventDefault()
    dialog.value?.focus()
  }
  else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(isOpen, (open) => {
  if (!import.meta.client) return
  if (open) lock()
  else unlock()
}, { flush: 'sync' })

watch(() => route.fullPath, close)

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  if (isOpen.value) lock()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  unlock()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="search-overlay"
      @click.self="close"
    >
      <section
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="search-dialog"
        @keydown="onDialogKeydown"
      >
        <div class="dialog-heading">
          <h2 :id="titleId">
            搜索文章
          </h2>
          <button
            type="button"
            class="dialog-close"
            aria-label="关闭搜索"
            @click="close"
          >
            <AppIcon name="close" />
          </button>
        </div>
        <SearchPanel
          v-model:query="query"
          show-key-hints
          @navigate="close"
          @escape="close"
        />
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: max(24px, 10dvh) 16px 24px;
  background: rgb(8 15 28 / 52%);
}

.search-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  max-height: 80dvh;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--elevated);
  box-shadow: 0 24px 80px rgb(0 0 0 / 24%);
}

.dialog-heading {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 0 22px;
}

.dialog-heading h2 {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .04em;
}

.dialog-close {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--muted);
  cursor: pointer;
}

.dialog-close:hover {
  color: var(--fg);
  background: var(--surface);
}

@media (max-width: 640px) {
  .search-overlay { padding: 16px 12px; }
  .search-dialog { max-height: calc(100dvh - 32px); }
  .dialog-heading { padding-left: 18px; }
}
</style>
