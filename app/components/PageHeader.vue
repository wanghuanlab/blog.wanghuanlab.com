<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>()
</script>

<template>
  <header class="mb-10 border-b border-border pb-8">
    <p
      v-if="eyebrow"
      class="mb-2 font-mono text-xs uppercase tracking-wider text-subtle"
    >
      {{ eyebrow }}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="mt-3 max-w-2xl leading-relaxed text-muted"
    >
      {{ description }}
    </p>
    <slot />
  </header>
</template>
