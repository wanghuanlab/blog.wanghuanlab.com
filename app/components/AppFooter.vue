<script setup lang="ts">
import { siteConfig } from '~~/config/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-border">
    <div class="container-page flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        © {{ year }} {{ siteConfig.author.name }} · {{ siteConfig.name }}
      </p>
      <ul class="flex flex-wrap items-center gap-x-5 gap-y-2 sm:pr-14">
        <li
          v-for="link in siteConfig.socialLinks"
          :key="link.name"
        >
          <a
            :href="link.url"
            class="link-muted inline-flex items-center gap-1.5"
            :target="link.url.startsWith('http') ? '_blank' : undefined"
            :rel="link.url.startsWith('http') ? 'noopener noreferrer' : undefined"
          >
            <AppIcon
              :name="link.icon"
              :size="15"
            />
            {{ link.name }}
          </a>
        </li>
        <li>
          <a
            href="/sitemap.xml"
            class="link-muted"
          >Sitemap</a>
        </li>
      </ul>
    </div>
  </footer>
</template>
