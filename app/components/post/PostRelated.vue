<script setup lang="ts">
import type { PostSummary } from '~/composables/usePosts'

defineProps<{
  posts: PostSummary[]
}>()
</script>

<template>
  <section
    v-if="posts.length"
    aria-labelledby="related-posts"
  >
    <h2
      id="related-posts"
      class="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle"
    >
      相关文章
    </h2>
    <ul class="divide-y divide-border rounded-lg border border-border">
      <li
        v-for="post in posts"
        :key="post.path"
      >
        <NuxtLink
          :to="post.path"
          class="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span class="font-medium leading-snug">{{ post.title }}</span>
          <span class="shrink-0 text-xs text-subtle">
            {{ post.category }} · <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
