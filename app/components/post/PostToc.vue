<script setup lang="ts">
export interface TocItem {
  id: string
  text: string
  depth: number
  children?: TocItem[]
}

const props = defineProps<{
  links: TocItem[]
  activeId?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

function flatten(items: TocItem[]): TocItem[] {
  return items.flatMap(item => [item, ...flatten(item.children ?? [])])
}

const items = computed(() => flatten(props.links))
const minDepth = computed(() => Math.min(...items.value.map(item => item.depth)))
</script>

<template>
  <ul class="space-y-1 border-l border-border text-sm">
    <li
      v-for="item in items"
      :key="item.id"
    >
      <a
        :href="`#${item.id}`"
        class="-ml-px block border-l py-1 leading-snug transition-colors"
        :class="item.id === activeId
          ? 'border-accent text-fg'
          : 'border-transparent text-muted hover:text-fg'"
        :style="{ paddingLeft: `${0.75 + (item.depth - minDepth) * 0.875}rem` }"
        :aria-current="item.id === activeId ? 'location' : undefined"
        @click="emit('select', item.id)"
      >
        {{ item.text }}
      </a>
    </li>
  </ul>
</template>
