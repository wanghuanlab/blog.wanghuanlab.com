<script setup lang="ts">
import type { PostSummary } from '~/composables/usePosts'

withDefaults(defineProps<{
  posts: PostSummary[]
  headingTag?: 'h2' | 'h3'
}>(), {
  headingTag: 'h2',
})
</script>

<template>
  <ul class="divide-y divide-border">
    <li
      v-for="post in posts"
      :key="post.path"
      class="py-7 first:pt-0 last:pb-0"
    >
      <article>
        <component
          :is="headingTag"
          class="text-xl font-semibold leading-snug tracking-tight"
        >
          <NuxtLink
            :to="post.path"
            class="transition-colors hover:text-accent"
          >
            {{ post.title }}
          </NuxtLink>
        </component>
        <p
          v-if="post.description"
          class="mt-2 line-clamp-2 leading-relaxed text-muted"
        >
          {{ post.description }}
        </p>
        <PostMeta
          class="mt-3"
          :date="post.date"
          :category="post.category"
          :reading-time="post.readingTime"
        />
        <PostTags
          class="mt-3"
          :tags="post.tags"
        />
      </article>
    </li>
  </ul>
</template>
