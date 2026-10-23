import tailwindcss from '@tailwindcss/vite'
import { siteConfig } from './config/site'
import { estimateReadingTime } from './shared/utils/reading-time'

export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/eslint'],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: siteConfig.locale },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'author', content: siteConfig.author.name },
        { name: 'theme-color', content: '#fafbfd', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#111923', media: '(prefers-color-scheme: dark)' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate', type: 'application/rss+xml', title: `${siteConfig.name} RSS`, href: '/rss.xml' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'wanghuan-lab-color-mode',
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 2, searchDepth: 2 },
        highlight: {
          theme: { default: 'github-light-default', dark: 'github-dark-default' },
          langs: [
            'java', 'kotlin', 'xml', 'properties', 'sql', 'bash', 'shell', 'powershell',
            'yaml', 'toml', 'ini', 'json', 'javascript', 'typescript', 'jsx', 'tsx', 'vue',
            'html', 'css', 'python', 'go', 'rust', 'dockerfile', 'nginx', 'markdown', 'diff',
          ],
        },
      },
    },
    experimental: { sqliteConnector: 'native' },
  },

  runtimeConfig: {
    public: {
      siteUrl: siteConfig.url,
    },
  },

  experimental: {
    defaults: {
      nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
    },
  },

  compatibilityDate: '2026-10-01',

  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/rss.xml', '/sitemap.xml', '/robots.txt', '/api/search.json'],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },

  telemetry: false,

  hooks: {
    'content:file:afterParse'(ctx) {
      if (ctx.collection.name === 'posts' && typeof ctx.file.body === 'string') {
        ctx.content.readingTime = estimateReadingTime(ctx.file.body)
      }
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
