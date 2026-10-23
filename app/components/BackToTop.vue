<script setup lang="ts">
const visible = ref(false)
let frame = 0
function update() {
  frame = 0
  visible.value = window.scrollY > 640
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
    class="back-top"
    aria-label="返回顶部"
    title="返回顶部"
    @click="scrollToTop"
  >
    <AppIcon name="arrow-up" />
  </button>
</template>

<style scoped>
.back-top {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 30;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--fg);
  color: var(--bg);
  transition: background var(--duration), transform var(--duration);
}
.back-top:hover {
  background: var(--accent);
  transform: translateY(-2px);
}
</style>
