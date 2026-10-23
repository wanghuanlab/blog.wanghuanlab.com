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
    class="grid gap-6 sm:grid-cols-2 sm:gap-10"
    aria-label="上一篇与下一篇"
  >
    <NuxtLink
      v-if="previous"
      :to="previous.path"
      rel="prev"
      class="group block py-2"
    >
      <span class="flex items-center gap-1.5 text-[13px] text-subtle">
        <AppIcon
          name="arrow-left"
          :size="14"
        />
        上一篇
      </span>
      <span class="mt-3 block font-medium leading-relaxed transition-colors group-hover:text-accent">{{ previous.title }}</span>
    </NuxtLink>
    <span
      v-else
      class="hidden sm:block"
    />
    <NuxtLink
      v-if="next"
      :to="next.path"
      rel="next"
      class="group block py-2 sm:text-right"
    >
      <span class="flex items-center gap-1.5 text-[13px] text-subtle sm:justify-end">
        下一篇
        <AppIcon
          name="arrow-right"
          :size="14"
        />
      </span>
      <span class="mt-3 block font-medium leading-relaxed transition-colors group-hover:text-accent">{{ next.title }}</span>
    </NuxtLink>
  </nav>
</template>
