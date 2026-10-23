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
const minDepth = computed(() => items.value.length ? Math.min(...items.value.map(item => item.depth)) : 0)
</script>

<template>
  <ul class="space-y-0.5 text-[13px]">
    <li
      v-for="item in items"
      :key="item.id"
    >
      <a
        :href="`#${item.id}`"
        class="block min-h-11 rounded py-2 pr-1 leading-relaxed break-words transition-colors xl:min-h-10"
        :class="item.id === activeId
          ? 'bg-accent-soft text-accent'
          : 'text-muted hover:bg-surface hover:text-fg'"
        :style="{ paddingLeft: `${0.75 + (item.depth - minDepth) * 0.875}rem` }"
        :aria-current="item.id === activeId ? 'location' : undefined"
        @click="emit('select', item.id)"
      >
        {{ item.text }}
      </a>
    </li>
  </ul>
</template>
