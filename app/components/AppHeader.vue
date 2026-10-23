<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const route = useRoute()
const { open: openSearch } = useSearchDialog()
const menuOpen = ref(false)
const shortcutLabel = ref('Ctrl K')
const menuButton = useTemplateRef<HTMLButtonElement>('menuButton')
const navItems = siteConfig.nav.filter(item => item.to !== '/search')

function isActive(to: string): boolean {
  const path = normalizePath(route.path)
  return to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`)
}

function closeMenu(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !menuOpen.value) return
  menuOpen.value = false
  menuButton.value?.focus()
}

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

onMounted(() => {
  if (/Mac|iPhone|iPad/i.test(navigator.userAgent)) shortcutLabel.value = '⌘ K'
})
</script>

<template>
  <header
    class="site-header"
    @keydown="closeMenu"
  >
    <div class="container-page header-inner">
      <NuxtLink
        to="/"
        class="brand"
        :aria-label="`${siteConfig.name} 首页`"
      >
        <span
          class="brand-mark"
          aria-hidden="true"
        >W.</span>
        <span>{{ siteConfig.name }}</span>
      </NuxtLink>
      <nav
        class="desktop-nav"
        aria-label="主导航"
      >
        <ul class="flex items-center gap-1">
          <li
            v-for="item in navItems"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              class="nav-link"
              :class="{ 'is-active': isActive(item.to) }"
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
          class="header-search"
          aria-label="打开搜索"
          aria-haspopup="dialog"
          @click="menuOpen = false; openSearch()"
        >
          <AppIcon
            name="search"
            :size="18"
          />
          <span class="search-label">搜索文章</span>
          <kbd class="search-shortcut">{{ shortcutLabel }}</kbd>
        </button>
        <ThemeToggle />
        <button
          ref="menuButton"
          type="button"
          class="icon-button menu-toggle"
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
      class="mobile-nav container-page"
      aria-label="移动端导航"
    >
      <ul class="grid grid-cols-2 gap-1 pb-4">
        <li
          v-for="item in siteConfig.nav"
          :key="item.to"
        >
          <NuxtLink
            :to="item.to"
            class="nav-link"
            :class="{ 'is-active': isActive(item.to) }"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg);
}
.header-inner {
  display: flex;
  height: var(--header-h);
  align-items: center;
  gap: 2.5rem;
}
.brand {
  display: inline-flex;
  min-height: 44px;
  flex-shrink: 0;
  align-items: center;
  gap: 0.65rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}
.brand-mark {
  color: var(--accent);
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.1em;
}
.desktop-nav {
  display: none;
}
.nav-link {
  display: flex;
  min-height: 44px;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  color: var(--muted);
  font-size: 0.9375rem;
  transition: color var(--duration), background var(--duration);
}
.nav-link:hover {
  color: var(--fg);
  background: var(--surface);
}
.nav-link.is-active {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 600;
}
.header-search {
  display: inline-flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border-radius: var(--radius);
  color: var(--muted);
  transition: color var(--duration), background var(--duration);
}
.header-search:hover {
  background: var(--surface);
  color: var(--fg);
}
.search-label, .search-shortcut {
  display: none;
}
@media (min-width: 1024px) {
  .desktop-nav {
    display: block;
  }
  .mobile-nav, .menu-toggle {
    display: none;
  }
}
@media (min-width: 1180px) {
  .header-search {
    padding: 0 0.75rem;
    background: var(--surface);
  }
  .search-label, .search-shortcut {
    display: inline-flex;
  }
  .search-shortcut {
    margin-left: 0.75rem;
    background: var(--bg);
  }
}
@media (max-width: 399px) {
  .header-inner {
    gap: 0.5rem;
  }
  .brand {
    gap: 0.4rem;
    font-size: 0.9375rem;
  }
  .brand-mark {
    font-size: 1.5rem;
  }
}
</style>
