<script setup lang="ts">
const props = withDefaults(defineProps<{
  autofocus?: boolean
  showKeyHints?: boolean
}>(), {
  autofocus: false,
  showKeyHints: false,
})

const emit = defineEmits<{
  navigate: []
  escape: []
}>()

const query = defineModel<string>('query', { default: '' })
const { documents, status, load } = useSearchIndex()
const input = useTemplateRef<HTMLInputElement>('input')
const list = useTemplateRef<HTMLUListElement>('list')
const activeIndex = ref(0)
const composing = ref(false)
const panelId = useId()
const resultsId = `${panelId}-results`
const hintId = `${panelId}-hint`

const prepared = computed(() => prepareDocuments(documents.value ?? []))
const terms = computed(() => tokenize(query.value))
const results = computed(() => searchDocuments(prepared.value, query.value))
const categories = computed(() => [...new Set((documents.value ?? []).map(doc => doc.category))].filter(Boolean).slice(0, 4))
const hasResults = computed(() => status.value === 'ready' && results.value.length > 0)
const resultSummary = computed(() => {
  if (status.value === 'loading') return '正在加载文章索引…'
  if (status.value === 'error') return '搜索暂时不可用，请重试。'
  if (!terms.value.length) return ''
  if (!results.value.length) return '没有找到匹配的文章。'
  return results.value.length === 20 ? '按相关度显示前 20 篇匹配文章' : `找到 ${results.value.length} 篇匹配文章`
})

watch(results, () => {
  activeIndex.value = 0
})

function optionId(index: number): string {
  return `${panelId}-option-${index}`
}

function moveActive(step: number) {
  const count = results.value.length
  if (!hasResults.value || !count) return
  activeIndex.value = (activeIndex.value + step + count) % count
  nextTick(() => {
    const option = list.value?.children[activeIndex.value]
    option?.scrollIntoView({ block: 'nearest' })
  })
}

async function openActive() {
  if (!hasResults.value) return
  const result = results.value[activeIndex.value]
  if (!result) return
  emit('navigate')
  await navigateTo(result.doc.path)
}

function clearQuery() {
  query.value = ''
  input.value?.focus()
}

function searchCategory(category: string) {
  query.value = category
  input.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (composing.value || event.isComposing || event.keyCode === 229) return
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Enter':
      event.preventDefault()
      openActive()
      break
    case 'Escape':
      emit('escape')
      break
  }
}

onMounted(() => {
  load()
  if (props.autofocus) input.value?.focus()
})
</script>

<template>
  <div class="search-panel">
    <div class="search-input-row">
      <AppIcon
        name="search"
        :size="20"
        class="search-input-icon"
      />
      <input
        ref="input"
        v-model="query"
        type="search"
        name="q"
        class="search-input"
        placeholder="输入关键词，发现一篇好文章"
        aria-label="搜索文章"
        role="combobox"
        aria-autocomplete="list"
        :aria-controls="resultsId"
        :aria-describedby="hintId"
        :aria-expanded="hasResults"
        :aria-activedescendant="hasResults ? optionId(activeIndex) : undefined"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeydown"
        @compositionstart="composing = true"
        @compositionend="composing = false"
      >
      <button
        v-if="query"
        type="button"
        class="search-clear"
        aria-label="清空搜索关键词"
        @click="clearQuery"
      >
        <AppIcon
          name="close"
          :size="16"
        />
      </button>
    </div>

    <div
      class="search-content"
      :aria-busy="status === 'loading'"
    >
      <p
        class="search-announcement"
        :class="{ 'sr-only': !hasResults }"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ resultSummary }}
      </p>
      <div
        v-if="status === 'error'"
        class="search-state"
      >
        <p class="search-state-title">
          暂时无法加载搜索
        </p>
        <p>请检查网络连接，再试一次。</p>
        <button
          type="button"
          class="search-retry"
          @click="load"
        >
          重新加载
          <AppIcon
            name="arrow-right"
            :size="16"
          />
        </button>
      </div>
      <div
        v-else-if="status === 'loading'"
        class="search-state"
      >
        <p class="search-state-title">
          正在准备搜索
        </p>
        <p>首次打开时需要加载文章索引，请稍候。</p>
      </div>
      <div
        v-else-if="!terms.length"
        class="search-state search-state-empty"
      >
        <p class="search-state-title">
          从一个问题或关键词开始
        </p>
        <p>搜索标题、摘要、正文、分类与标签。</p>
        <div
          v-if="categories.length"
          class="search-suggestions"
          aria-label="按分类搜索"
        >
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            @click="searchCategory(category)"
          >
            {{ category }}
            <AppIcon
              name="arrow-right"
              :size="14"
            />
          </button>
        </div>
      </div>
      <div
        v-else-if="!results.length"
        class="search-state"
      >
        <p class="search-state-title">
          没有找到匹配的文章
        </p>
        <p>试试更短的关键词，或减少用空格分隔的词语。</p>
        <button
          type="button"
          class="search-retry"
          @click="clearQuery"
        >
          清空并重新搜索
        </button>
      </div>
      <ul
        v-else
        :id="resultsId"
        ref="list"
        class="search-results"
        role="listbox"
        aria-label="搜索结果"
      >
        <li
          v-for="(result, index) in results"
          :id="optionId(index)"
          :key="result.doc.path"
          role="option"
          :aria-selected="index === activeIndex"
        >
          <NuxtLink
            :to="result.doc.path"
            class="search-result"
            :class="{ 'is-active': index === activeIndex }"
            tabindex="-1"
            @mouseenter="activeIndex = index"
            @click="emit('navigate')"
          >
            <span class="search-result-category">{{ result.doc.category }}</span>
            <span class="search-result-title">
              <SearchHighlight
                :text="result.doc.title"
                :terms="terms"
              />
              <AppIcon
                name="arrow-right"
                :size="16"
              />
            </span>
            <p class="search-result-snippet">
              <SearchHighlight
                :text="result.snippet"
                :terms="terms"
              />
            </p>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="search-footer">
      <p :id="hintId">
        多个关键词用空格分隔
      </p>
      <div
        v-if="showKeyHints"
        class="search-key-hints"
        aria-hidden="true"
      >
        <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
        <span><kbd>↵</kbd> 打开</span>
        <span><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.search-input-row {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  margin: 0 22px;
  border-bottom: 1px solid var(--border);
}

.search-input-icon { flex-shrink: 0; color: var(--accent); }

.search-input {
  width: 100%;
  min-width: 0;
  height: 60px;
  background: transparent;
  color: var(--fg);
  font-size: 17px;
}

.search-input::placeholder { color: var(--subtle); }
.search-input::-webkit-search-cancel-button { display: none; }
.search-input:focus-visible { outline-offset: -3px; }

.search-clear {
  display: inline-flex;
  flex: none;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--muted);
  cursor: pointer;
}

.search-clear:hover { color: var(--fg); background: var(--surface); }

.search-content {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 10px;
}

.search-announcement {
  padding: 12px 12px 6px;
  color: var(--muted);
  font-size: 13px;
}

.search-state {
  padding: 34px 12px 38px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.search-state-title {
  margin-bottom: 6px;
  color: var(--fg);
  font-size: 17px;
  font-weight: 600;
}

.search-state-empty { padding-bottom: 24px; }

.search-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 18px;
}

.search-suggestions button,
.search-retry {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  color: var(--accent);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.search-retry { margin-top: 12px; }
.search-suggestions button:hover, .search-retry:hover { text-decoration: underline; text-underline-offset: 4px; }
.search-results { margin: 0; padding: 0; list-style: none; }

.search-result {
  display: block;
  border-radius: 4px;
  padding: 14px 12px 16px;
  transition: background-color 150ms;
}

.search-result.is-active { background: var(--surface); }
.search-result-category { display: block; margin-bottom: 5px; color: var(--accent); font-size: 13px; }

.search-result-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  color: var(--fg);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.search-result-title svg { flex-shrink: 0; color: var(--muted); }

.search-result-snippet {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 6px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-footer {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding: 14px 22px;
  color: var(--subtle);
  font-size: 13px;
}

.search-key-hints { display: flex; gap: 14px; }
.search-key-hints span { display: inline-flex; align-items: center; gap: 4px; }

@media (max-width: 640px) {
  .search-input-row { margin-right: 18px; margin-left: 18px; gap: 10px; }
  .search-input { font-size: 16px; }
  .search-key-hints { display: none; }
  .search-footer { padding-right: 18px; padding-left: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .search-result { transition: none; }
}
</style>
