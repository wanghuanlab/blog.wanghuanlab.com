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
        class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-border-strong hover:bg-surface"
      >
        <span>{{ term.name }}</span>
        <span
          v-if="showCount"
          class="font-mono text-xs text-subtle"
        >{{ term.count }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
