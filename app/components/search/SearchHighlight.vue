<script setup lang="ts">
const props = defineProps<{
  text: string
  terms: string[]
}>()

const segments = computed(() => highlightSegments(props.text, props.terms))
</script>

<template>
  <span><template
    v-for="(segment, index) in segments"
    :key="index"
  ><mark
    v-if="segment.match"
    class="rounded-sm bg-mark text-inherit"
  >{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
</template>
