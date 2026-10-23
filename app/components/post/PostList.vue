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
  <ul class="post-list">
    <li
      v-for="post in posts"
      :key="post.path"
    >
      <article class="post-entry">
        <PostMeta
          :date="post.date"
          :category="post.category"
          :reading-time="post.readingTime"
        />
        <component
          :is="headingTag"
          class="post-entry-title"
        >
          <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
        </component>
        <p
          v-if="post.description"
          class="post-entry-description"
        >
          {{ post.description }}
        </p>
        <div
          v-if="post.tags.length"
          class="mt-3 flex flex-wrap items-center gap-x-2"
        >
          <PostTags :tags="post.tags.slice(0, 3)" />
          <span
            v-if="post.tags.length > 3"
            class="text-[13px] text-subtle"
          >另 {{ post.tags.length - 3 }} 个标签</span>
        </div>
      </article>
    </li>
  </ul>
</template>

<style scoped>
.post-list {
  display: grid;
  gap: 2.75rem;
}
.post-entry {
  min-width: 0;
}
.post-entry-title {
  margin-top: 0.65rem;
  font-size: var(--text-story);
  font-weight: 650;
  line-height: 1.5;
  letter-spacing: -0.03em;
}
.post-entry-title a {
  display: block;
  transition: color var(--duration);
}
.post-entry-title a:hover {
  color: var(--accent);
}
.post-entry-description {
  display: -webkit-box;
  max-width: 60ch;
  overflow: hidden;
  margin-top: 0.7rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--muted);
  font-size: var(--text-body);
  line-height: 1.85;
}
@media (max-width: 639px) {
  .post-list {
    gap: 2.5rem;
  }
  .post-entry-title {
    font-size: 1.25rem;
  }
}
</style>
