<script setup lang="ts">
/* 图标路径基于 Lucide（ISC License），内联以避免引入图标库。 */
type IconShape
  = | ['path', { d: string }]
    | ['circle', { cx: number, cy: number, r: number }]
    | ['rect', { width: number, height: number, x: number, y: number, rx: number }]

const path = (d: string): IconShape => ['path', { d }]
const circle = (cx: number, cy: number, r: number): IconShape => ['circle', { cx, cy, r }]
const rect = (x: number, y: number, width: number, height: number, rx: number): IconShape => ['rect', { x, y, width, height, rx }]

const ICONS = {
  'search': [circle(11, 11, 7), path('m20 20-3.5-3.5')],
  'sun': [circle(12, 12, 4), path('M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41')],
  'moon': [path('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z')],
  'monitor': [rect(2, 3, 20, 14, 2), path('M8 21h8M12 17v4')],
  'menu': [path('M4 6h16M4 12h16M4 18h16')],
  'close': [path('M18 6 6 18M6 6l12 12')],
  'arrow-up': [path('m5 12 7-7 7 7M12 19V5')],
  'arrow-left': [path('m12 19-7-7 7-7M19 12H5')],
  'arrow-right': [path('M5 12h14M12 5l7 7-7 7')],
  'copy': [rect(8, 8, 14, 14, 2), path('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2')],
  'check': [path('M20 6 9 17l-5-5')],
  'list': [path('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01')],
  'chevron-down': [path('m6 9 6 6 6-6')],
  'file': [path('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'), path('M14 2v4a2 2 0 0 0 2 2h4')],
  'rss': [path('M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16'), circle(5, 19, 1)],
  'mail': [rect(2, 4, 20, 16, 2), path('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7')],
  'github': [
    path('M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4'),
    path('M9 18c-4.51 2-5-2-7-2'),
  ],
} satisfies Record<string, IconShape[]>

export type IconName = keyof typeof ICONS

const props = withDefaults(defineProps<{
  name: IconName
  size?: number
}>(), {
  size: 18,
})

const shapes = computed(() => ICONS[props.name])
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <component
      :is="tag"
      v-for="([tag, attrs], index) in shapes"
      :key="index"
      v-bind="attrs"
    />
  </svg>
</template>
