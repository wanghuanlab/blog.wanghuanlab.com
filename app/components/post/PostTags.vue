<script setup lang="ts">
defineProps<{
  tags: string[]
}>()
</script>

<template>
  <ul
    v-if="tags.length"
    class="flex flex-wrap gap-x-1 gap-y-0"
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
        <span
          class="mr-1 opacity-60"
          aria-hidden="true"
        >#</span>{{ tag }}
      </NuxtLink>
    </li>
  </ul>
</template>
