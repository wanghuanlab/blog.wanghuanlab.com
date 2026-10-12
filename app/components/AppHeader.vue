<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const route = useRoute()
const { open: openSearch } = useSearchDialog()
const menuOpen = ref(false)
const shortcutLabel = ref('Ctrl K')

function isActive(to: string): boolean {
  const path = normalizePath(route.path)
  if (to === '/') return path === '/'
  return path === to || path.startsWith(`${to}/`)
}

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

onMounted(() => {
  if (/Mac|iPhone|iPad/i.test(navigator.userAgent)) shortcutLabel.value = '⌘ K'
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
    <div class="container-page flex h-(--header-h) items-center gap-6">
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
      >
        <span
          class="inline-flex size-6 items-center justify-center rounded-md bg-fg font-mono text-xs font-bold text-bg"
          aria-hidden="true"
        >W</span>
        <span>{{ siteConfig.name }}</span>
      </NuxtLink>

      <nav
        class="hidden md:block"
        aria-label="主导航"
      >
        <ul class="flex items-center gap-1 text-sm">
          <li
            v-for="item in siteConfig.nav"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              class="rounded-md px-2.5 py-1.5 transition-colors hover:text-fg"
              :class="isActive(item.to) ? 'font-medium text-fg' : 'text-muted'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="ml-auto flex items-center gap-1">
        <button
          type="button"
          class="hidden h-8 items-center gap-2 rounded-md border border-border pl-2.5 pr-1.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-fg lg:inline-flex"
          aria-label="打开搜索"
          @click="openSearch"
        >
          <AppIcon
            name="search"
            :size="15"
          />
          <span class="pr-6">搜索文章</span>
          <kbd>{{ shortcutLabel }}</kbd>
        </button>
        <button
          type="button"
          class="icon-button lg:hidden"
          aria-label="打开搜索"
          @click="openSearch"
        >
          <AppIcon name="search" />
        </button>
        <a
          :href="siteConfig.github"
          class="icon-button"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <AppIcon name="github" />
        </a>
        <ThemeToggle />
        <button
          type="button"
          class="icon-button md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-nav"
          :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
          @click="menuOpen = !menuOpen"
        >
          <AppIcon :name="menuOpen ? 'close' : 'menu'" />
        </button>
      </div>
    </div>

    <nav
      v-show="menuOpen"
      id="mobile-nav"
      class="border-t border-border md:hidden"
      aria-label="移动端导航"
    >
      <ul class="container-page grid gap-1 py-3">
        <li
          v-for="item in siteConfig.nav"
          :key="item.to"
        >
          <NuxtLink
            :to="item.to"
            class="block rounded-md px-3 py-2 transition-colors hover:bg-surface"
            :class="isActive(item.to) ? 'bg-surface font-medium text-fg' : 'text-muted'"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
