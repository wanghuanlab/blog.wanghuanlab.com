<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  title?: string
  fallbackImg?: string
  height?: string | number
}>(), {
  title: '交互式架构图',
  fallbackImg: '',
  height: 520,
})

const colorMode = useColorMode()
const containerRef = ref<HTMLElement | null>(null)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const state = ref<'loading' | 'ready' | 'error'>('loading')
const frameKey = ref(0)
const naturalHeight = ref<number | null>(null)
let loadTimer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined
let widthObserver: ResizeObserver | undefined
let layoutFrame = 0
let lastWidth = 0
let isVisible = false

function diagramUrl(embedded: boolean) {
  const [pathAndQuery = '', hash] = props.src.split('#')
  const [path = '', query] = pathAndQuery.split('?')
  const params = new URLSearchParams(query)
  params.set('theme', colorMode.value === 'dark' ? 'dark' : 'light')
  if (embedded) params.set('embed', '1')
  else params.delete('embed')
  return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`
}

// Keep this stable on theme changes so the iframe retains its zoom and selection.
const embedSrc = ref(diagramUrl(true))
const standaloneSrc = computed(() => diagramUrl(false))
const heightStyle = computed(() => {
  const height = String(props.height)
  const configuredHeight = /^\d+(\.\d+)?$/.test(height) ? `${height}px` : height
  return naturalHeight.value === null ? configuredHeight : `min(${configuredHeight}, ${naturalHeight.value}px)`
})

function fitDiagramHeight() {
  layoutFrame = 0
  if (state.value !== 'ready') return
  try {
    const frame = iframeRef.value
    const document = frame?.contentDocument
    const view = document?.defaultView
    const diagram = document?.querySelector<HTMLElement>('.diagram-container')
    const svg = diagram?.querySelector<SVGSVGElement>(':scope > svg')
    const viewBox = svg?.viewBox.baseVal
    if (!document || !view || !diagram || !svg || !viewBox || viewBox.width <= 0 || viewBox.height <= 0) return

    const diagramStyle = view.getComputedStyle(diagram)
    const svgStyle = view.getComputedStyle(svg)
    const bodyStyle = view.getComputedStyle(document.body)
    const pixels = (value: string) => Number.parseFloat(value) || 0
    const innerWidth = diagram.clientWidth - pixels(diagramStyle.paddingLeft) - pixels(diagramStyle.paddingRight)
    // clientWidth is the layout width: pan/zoom transforms never affect this measurement.
    const svgWidth = svg.clientWidth || innerWidth
    if (svgWidth <= 0) return
    const top = diagram.getBoundingClientRect().top + view.scrollY
    const chrome = pixels(diagramStyle.borderTopWidth) + pixels(diagramStyle.paddingTop)
      + pixels(svgStyle.marginTop) + pixels(svgStyle.marginBottom)
      + pixels(diagramStyle.paddingBottom) + pixels(diagramStyle.borderBottomWidth)
      + pixels(bodyStyle.paddingBottom) + pixels(bodyStyle.marginBottom)
    naturalHeight.value = Math.max(220, Math.ceil(top + svgWidth * viewBox.height / viewBox.width + chrome))
  }
  catch {
    // Remote documents and unrecognised layouts retain the configured height.
  }
}

function scheduleHeightFit() {
  if (!layoutFrame) layoutFrame = requestAnimationFrame(fitDiagramHeight)
}

function onContainerResize() {
  const width = containerRef.value?.clientWidth ?? 0
  // Observing the figure also reports our height changes. Only width can trigger a refit.
  if (Math.abs(width - lastWidth) < 1) return
  lastWidth = width
  scheduleHeightFit()
}

function syncTheme() {
  try {
    const document = iframeRef.value?.contentDocument
    const theme = colorMode.value === 'dark' ? 'dark' : 'light'
    const currentTheme = document?.documentElement.getAttribute('data-theme')
    const toggle = document?.getElementById('btn-theme')
    // Earlier diagrams and remote embeds may not expose a theme control.
    if ((currentTheme === 'light' || currentTheme === 'dark') && currentTheme !== theme && toggle) {
      toggle.click()
    }
  }
  catch {
    // Cross-origin diagrams use the initial theme query parameter when supported.
  }
}

function startLoadTimer() {
  clearTimeout(loadTimer)
  if (!isVisible || state.value === 'ready') return
  loadTimer = setTimeout(() => {
    state.value = 'error'
  }, 15000)
}

function onLoad() {
  clearTimeout(loadTimer)
  try {
    const document = iframeRef.value?.contentDocument
    // A missing local HTML file can still fire `load` with the site's 404 page.
    if (document && !document.querySelector('.diagram-container, [data-diagram-type], svg[data-graph-role], canvas')) {
      onError()
      return
    }
  }
  catch {
    // A loaded remote document is opaque to the parent.
  }
  state.value = 'ready'
  syncTheme()
  scheduleHeightFit()
}

function onError() {
  clearTimeout(loadTimer)
  state.value = 'error'
}

function retry() {
  state.value = 'loading'
  naturalHeight.value = null
  embedSrc.value = diagramUrl(true)
  frameKey.value += 1
  startLoadTimer()
}

watch(() => colorMode.value, syncTheme)
watch(() => props.src, retry)
watch(() => props.height, scheduleHeightFit)

onMounted(() => {
  syncTheme()
  if (typeof ResizeObserver !== 'undefined') {
    widthObserver = new ResizeObserver(onContainerResize)
    if (containerRef.value) widthObserver.observe(containerRef.value)
  }
  else {
    window.addEventListener('resize', onContainerResize, { passive: true })
  }
  if (!('IntersectionObserver' in window)) {
    isVisible = true
    startLoadTimer()
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    isVisible = true
    startLoadTimer()
    observer?.disconnect()
  }, { rootMargin: '160px' })
  if (containerRef.value) observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  clearTimeout(loadTimer)
  observer?.disconnect()
  widthObserver?.disconnect()
  window.removeEventListener('resize', onContainerResize)
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
})
</script>

<template>
  <figure
    ref="containerRef"
    class="diagram-embed"
  >
    <figcaption class="diagram-embed__header">
      <div class="min-w-0">
        <span class="diagram-embed__title">{{ title }}</span>
      </div>
      <a
        :href="standaloneSrc"
        target="_blank"
        rel="noopener noreferrer"
        class="diagram-embed__open"
        :aria-label="`${title}，在新标签页打开`"
      >
        独立打开
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </figcaption>

    <div
      class="diagram-embed__canvas"
      :style="{ '--diagram-height': heightStyle }"
      :aria-busy="state === 'loading'"
    >
      <iframe
        :key="frameKey"
        ref="iframeRef"
        :src="embedSrc"
        :title="title"
        class="diagram-embed__frame"
        loading="lazy"
        allow="clipboard-write"
        @load="onLoad"
        @error="onError"
      />
      <div
        v-if="state !== 'ready'"
        class="diagram-embed__status"
        role="status"
      >
        <template v-if="state === 'loading'">
          <span class="text-sm text-muted">正在加载架构图…</span>
        </template>
        <template v-else>
          <img
            v-if="fallbackImg"
            :src="fallbackImg"
            :alt="title"
            class="diagram-embed__fallback"
          >
          <p class="text-sm text-muted">
            架构图暂未加载完成。
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              class="button-secondary"
              @click="retry"
            >
              重新加载
            </button>
            <a
              :href="standaloneSrc"
              target="_blank"
              rel="noopener noreferrer"
              class="button-secondary"
            >在新标签页打开</a>
          </div>
        </template>
      </div>
    </div>
    <div class="diagram-embed__hint">
      可在图中探索；需要更大画布时，可在新标签页打开。
    </div>
  </figure>
</template>

<style scoped>
.diagram-embed {
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--surface);
}

.diagram-embed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4rem;
  padding: 0.75rem 1rem;
}

.diagram-embed__title {
  display: block;
  color: var(--fg);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.6;
}

.prose .diagram-embed__open {
  display: inline-flex;
  flex-shrink: 0;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.375rem;
  color: var(--accent);
  font-size: 0.8125rem;
  text-decoration: none;
}

.prose .diagram-embed__open:hover {
  text-decoration: underline;
}

.diagram-embed__canvas {
  position: relative;
  height: var(--diagram-height);
  background: var(--bg);
}

.diagram-embed__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.diagram-embed__status {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  overflow: auto;
  padding: 1.5rem;
  background: var(--bg);
  text-align: center;
}

.prose .diagram-embed__status p {
  margin: 0;
}

.prose .diagram-embed__fallback {
  max-height: 65%;
  margin: 0;
  object-fit: contain;
}

.prose .diagram-embed__status .button-secondary {
  text-decoration: none;
}

.diagram-embed__hint {
  padding: 0.65rem 1rem;
  color: var(--subtle);
  font-size: 0.8125rem;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .diagram-embed__header {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .diagram-embed__hint {
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }
}
</style>
