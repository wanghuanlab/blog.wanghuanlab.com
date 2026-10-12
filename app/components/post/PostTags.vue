<script setup lang="ts">
defineProps<{
  tags: string[]
}>()
</script>

<template>
  <ul
    v-if="tags.length"
    class="flex flex-wrap gap-1.5"
    aria-label="标签"
  >
    <li
      v-for="tag in tags"
      :key="tag"
    >
      <NuxtLink
        :to="`/tags/${slugify(tag)}`"
        class="chip"
      >
        # {{ tag }}
      </NuxtLink>
    </li>
  </ul>
</template>
