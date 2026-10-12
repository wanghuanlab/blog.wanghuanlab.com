<script setup lang="ts">
import type { PostSummary } from '~/composables/usePosts'

defineProps<{
  previous?: PostSummary
  next?: PostSummary
}>()
</script>

<template>
  <nav
    v-if="previous || next"
    class="grid gap-3 sm:grid-cols-2"
    aria-label="上一篇与下一篇"
  >
    <NuxtLink
      v-if="previous"
      :to="previous.path"
      rel="prev"
      class="group rounded-lg border border-border p-4 transition-colors hover:border-border-strong hover:bg-surface"
    >
      <span class="flex items-center gap-1.5 text-xs text-subtle">
        <AppIcon
          name="arrow-left"
          :size="14"
        />
        上一篇
      </span>
      <span class="mt-1.5 block font-medium leading-snug group-hover:text-accent">{{ previous.title }}</span>
    </NuxtLink>
    <span
      v-else
      class="hidden sm:block"
    />
    <NuxtLink
      v-if="next"
      :to="next.path"
      rel="next"
      class="group rounded-lg border border-border p-4 text-right transition-colors hover:border-border-strong hover:bg-surface"
    >
      <span class="flex items-center justify-end gap-1.5 text-xs text-subtle">
        下一篇
        <AppIcon
          name="arrow-right"
          :size="14"
        />
      </span>
      <span class="mt-1.5 block font-medium leading-snug group-hover:text-accent">{{ next.title }}</span>
    </NuxtLink>
  </nav>
</template>
