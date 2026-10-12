<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

interface ThemeOption {
  value: 'system' | 'light' | 'dark'
  label: string
  icon: IconName
}

const OPTIONS: ThemeOption[] = [
  { value: 'system', label: '跟随系统', icon: 'monitor' },
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
]

const colorMode = useColorMode()

const currentIndex = computed(() => Math.max(0, OPTIONS.findIndex(option => option.value === colorMode.preference)))
const current = computed(() => OPTIONS[currentIndex.value]!)
const next = computed(() => OPTIONS[(currentIndex.value + 1) % OPTIONS.length]!)

function cycle() {
  colorMode.preference = next.value.value
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="icon-button"
      :title="`主题：${current.label}（点击切换为${next.label}）`"
      :aria-label="`当前主题：${current.label}，切换为${next.label}`"
      @click="cycle"
    >
      <AppIcon :name="current.icon" />
    </button>
    <template #fallback>
      <span
        class="icon-button"
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>
