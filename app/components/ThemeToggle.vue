<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

interface ThemeOption {
  value: 'system' | 'light' | 'dark'
  label: string
  english: string
  icon: IconName
}

const OPTIONS: ThemeOption[] = [
  { value: 'light', label: '浅色', english: 'Light', icon: 'sun' },
  { value: 'dark', label: '深色', english: 'Dark', icon: 'moon' },
  { value: 'system', label: '跟随系统', english: 'System', icon: 'monitor' },
]

const colorMode = useColorMode()
const route = useRoute()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const menu = useTemplateRef<HTMLElement>('menu')
const open = ref(false)
const menuId = useId()
const current = computed(() => OPTIONS.find(option => option.value === colorMode.preference) ?? OPTIONS[2]!)

function close(restoreFocus = false) {
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}

function showMenu() {
  open.value = true
  nextTick(() => {
    menu.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
  })
}

function toggleMenu() {
  if (open.value) close()
  else showMenu()
}

function selectTheme(value: ThemeOption['value']) {
  colorMode.preference = value
  close(true)
}

function onOutsidePointer(event: PointerEvent) {
  if (open.value && event.target instanceof Node && !root.value?.contains(event.target)) close()
}

function onFocusout(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !root.value?.contains(event.relatedTarget)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    close(true)
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (!open.value) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      showMenu()
    }
    return
  }
  event.preventDefault()
  const options = [...(menu.value?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])]
  const index = options.findIndex(option => option === document.activeElement)
  const next = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? options.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
  options[next]?.focus()
}

watch(() => route.fullPath, () => close())
onMounted(() => document.addEventListener('pointerdown', onOutsidePointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsidePointer))
</script>

<template>
  <ClientOnly>
    <div
      ref="root"
      class="theme-switcher"
      @keydown="onKeydown"
      @focusout="onFocusout"
    >
      <button
        ref="trigger"
        type="button"
        class="theme-trigger"
        :title="`主题：${current.label}`"
        :aria-label="`主题：${current.label}，选择外观`"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-controls="menuId"
        @click="toggleMenu"
      >
        <AppIcon :name="current.icon" />
      </button>
      <div
        v-if="open"
        :id="menuId"
        ref="menu"
        class="theme-menu"
        role="menu"
        aria-label="选择外观"
      >
        <p
          class="theme-heading"
          role="presentation"
        >
          外观
        </p>
        <button
          v-for="option in OPTIONS"
          :key="option.value"
          type="button"
          role="menuitemradio"
          tabindex="-1"
          :aria-checked="colorMode.preference === option.value"
          class="theme-option"
          @click="selectTheme(option.value)"
        >
          <AppIcon
            :name="option.icon"
            :size="17"
          />
          <span class="theme-label">{{ option.label }}</span>
          <span class="theme-english">{{ option.english }}</span>
          <AppIcon
            v-if="colorMode.preference === option.value"
            name="check"
            :size="15"
            class="theme-check"
          />
          <span
            v-else
            class="theme-check-placeholder"
          />
        </button>
      </div>
    </div>
    <template #fallback>
      <span
        class="theme-placeholder"
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>

<style scoped>
.theme-switcher { position: relative; }

.theme-trigger, .theme-placeholder {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--muted);
}

.theme-trigger { cursor: pointer; }
.theme-trigger:hover, .theme-trigger[aria-expanded="true"] { color: var(--fg); background: var(--surface); }

.theme-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 60;
  width: 236px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--elevated);
  box-shadow: 0 12px 36px rgb(0 0 0 / 12%);
}

.theme-heading { padding: 8px 10px; color: var(--muted); font-size: 13px; }

.theme-option {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border-radius: 4px;
  color: var(--muted);
  text-align: left;
  cursor: pointer;
}

.theme-option:hover, .theme-option:focus-visible { background: var(--surface); color: var(--fg); }
.theme-option[aria-checked="true"] { color: var(--accent); }
.theme-label { color: var(--fg); font-size: 14px; }
.theme-english { margin-left: auto; color: var(--subtle); font-size: 13px; }
.theme-check { flex-shrink: 0; }
.theme-check-placeholder { width: 15px; }
</style>
