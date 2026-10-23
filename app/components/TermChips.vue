<script setup lang="ts">
import type { Term } from '#shared/utils/taxonomy'

defineProps<{
  terms: Term[]
  basePath: '/categories' | '/tags'
  showCount?: boolean
}>()
</script>

<template>
  <ul class="flex flex-wrap gap-2">
    <li
      v-for="term in terms"
      :key="term.slug"
    >
      <NuxtLink
        :to="`${basePath}/${term.slug}`"
        class="inline-flex min-h-11 max-w-full items-center gap-3 rounded bg-surface px-3 py-2 text-sm transition-colors hover:bg-accent-soft hover:text-accent"
      >
        <span>{{ term.name }}</span>
        <span
          v-if="showCount"
          class="text-[13px] text-subtle [font-variant-numeric:tabular-nums]"
        >{{ term.count }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
