<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container-page">
      <div class="footer-top">
        <div>
          <NuxtLink
            to="/"
            class="footer-brand"
          >{{ siteConfig.name }}</NuxtLink>
          <p class="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {{ siteConfig.description }}
          </p>
        </div>
        <ul class="flex flex-wrap gap-x-6 gap-y-1">
          <li
            v-for="link in siteConfig.socialLinks"
            :key="link.name"
          >
            <a
              :href="link.url"
              class="footer-link"
              :target="link.url.startsWith('http') ? '_blank' : undefined"
              :rel="link.url.startsWith('http') ? 'noopener noreferrer' : undefined"
            >
              <AppIcon
                :name="link.icon"
                :size="17"
              />
              {{ link.name }}
              <span
                v-if="link.url.startsWith('http')"
                class="sr-only"
              >（在新标签页打开）</span>
            </a>
          </li>
        </ul>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} {{ siteConfig.author.name }}</p>
        <a
          href="/sitemap.xml"
          class="footer-link"
        >站点地图</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: clamp(4rem, 8vw, 7rem);
  padding: 3rem 0 1.5rem;
  background: var(--surface);
}
.footer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}
.footer-brand {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.05em;
}
.footer-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.875rem;
  transition: color var(--duration);
}
.footer-link:hover {
  color: var(--accent);
}
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2.5rem;
  gap: 1rem;
  color: var(--subtle);
  font-size: 0.8125rem;
}
@media (max-width: 639px) {
  .site-footer {
    padding-top: 2rem;
  }
  .footer-top {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
