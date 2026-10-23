<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="page-header">
    <h1>{{ title }}</h1>
    <p v-if="description">
      {{ description }}
    </p>
    <slot />
  </header>
</template>

<style scoped>
.page-header {
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}
.page-header h1 {
  font-size: var(--text-page);
  font-weight: 650;
  letter-spacing: -0.05em;
  line-height: 1.2;
}
.page-header p {
  max-width: 38rem;
  margin-top: 1rem;
  color: var(--muted);
  font-size: 1.0625rem;
  line-height: 1.8;
}
</style>
