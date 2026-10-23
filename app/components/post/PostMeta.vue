<script setup lang="ts">
defineProps<{
  date: string
  category: string
  readingTime: number
  updated?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-subtle [font-variant-numeric:tabular-nums]">
    <time :datetime="date">{{ formatDate(date) }}</time>
    <template v-if="updated && updated !== date">
      <span aria-hidden="true">·</span>
      <span>更新于 <time :datetime="updated">{{ formatDate(updated) }}</time></span>
    </template>
    <span aria-hidden="true">·</span>
    <NuxtLink
      :to="`/categories/${slugify(category)}`"
      class="inline-flex min-h-7 items-center transition-colors hover:text-accent hover:underline"
    >
      {{ category }}
    </NuxtLink>
    <span aria-hidden="true">·</span>
    <span>约 {{ readingTime }} 分钟</span>
  </div>
</template>
