<script setup lang="ts">
const SHOW_AFTER = 640

const visible = ref(false)
let frame = 0

function update() {
  frame = 0
  visible.value = window.scrollY > SHOW_AFTER
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

function scrollToTop() {
  window.scrollTo({ top: 0 })
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <button
    v-show="visible"
    type="button"
    class="fixed bottom-6 right-6 z-30 inline-flex size-10 items-center justify-center rounded-full border border-border bg-elevated text-muted shadow-sm transition-colors hover:text-fg"
    aria-label="返回顶部"
    title="返回顶部"
    @click="scrollToTop"
  >
    <AppIcon name="arrow-up" />
  </button>
</template>
