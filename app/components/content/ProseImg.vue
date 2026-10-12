<script setup lang="ts">
withDefaults(defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
}>(), {
  src: '',
  alt: '',
  width: undefined,
  height: undefined,
})
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
  >
</template>
