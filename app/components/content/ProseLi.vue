<script setup lang="ts">
const attrs = useAttrs()
const isTaskItem = computed(() => String(attrs.class ?? '').split(/\s+/).includes('task-list-item'))
</script>

<template>
  <li>
    <label v-if="isTaskItem"><slot /></label>
    <slot v-else />
  </li>
</template>
