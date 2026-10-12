<script setup lang="ts">
const props = withDefaults(defineProps<{
  href?: string
  target?: string
}>(), {
  href: '',
  target: undefined,
})

const isExternal = computed(() => /^(https?:)?\/\//.test(props.href))
</script>

<template>
  <a
    v-if="isExternal"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  ><slot /></a>
  <NuxtLink
    v-else
    :to="href"
    :target="target"
  ><slot /></NuxtLink>
</template>
