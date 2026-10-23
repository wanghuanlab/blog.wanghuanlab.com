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
      class="mb-4 text-lg font-semibold tracking-tight"
    >
      相关文章
    </h2>
    <ul class="space-y-1">
      <li
        v-for="post in posts"
        :key="post.path"
      >
        <NuxtLink
          :to="post.path"
          class="group flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
        >
          <span class="font-medium leading-relaxed transition-colors group-hover:text-accent">{{ post.title }}</span>
          <span class="shrink-0 text-[13px] text-subtle">
            {{ post.category }} · <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
