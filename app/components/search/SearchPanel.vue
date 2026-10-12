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

const prepared = computed(() => prepareDocuments(documents.value ?? []))
const terms = computed(() => tokenize(query.value))
const results = computed(() => searchDocuments(prepared.value, query.value))

watch(results, () => {
  activeIndex.value = 0
})

function optionId(index: number): string {
  return `search-option-${index}`
}

function moveActive(step: number) {
  const count = results.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + step + count) % count
  nextTick(() => {
    list.value?.querySelector(`#${optionId(activeIndex.value)}`)?.scrollIntoView({ block: 'nearest' })
  })
}

async function openActive() {
  const result = results.value[activeIndex.value]
  if (!result) return
  emit('navigate')
  await navigateTo(result.doc.path)
}

function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
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
  <div class="flex min-h-0 flex-col">
    <div class="flex items-center gap-3 border-b border-border px-4">
      <AppIcon
        name="search"
        class="shrink-0 text-subtle"
      />
      <input
        ref="input"
        v-model="query"
        type="search"
        name="q"
        class="h-13 w-full bg-transparent text-base outline-none placeholder:text-subtle"
        placeholder="搜索标题、摘要、正文、分类或标签"
        aria-label="搜索文章"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="search-results"
        :aria-expanded="results.length > 0"
        :aria-activedescendant="results.length ? optionId(activeIndex) : undefined"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeydown"
      >
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
      <p
        v-if="status === 'error'"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        搜索索引加载失败，请刷新页面后重试。
      </p>
      <p
        v-else-if="!terms.length"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        输入关键词开始搜索，多个关键词用空格分隔。
      </p>
      <p
        v-else-if="status !== 'ready'"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        正在加载搜索索引…
      </p>
      <p
        v-else-if="!results.length"
        class="px-3 py-8 text-center text-sm text-muted"
      >
        没有找到与 “{{ query }}” 相关的文章。
      </p>
      <ul
        v-else
        id="search-results"
        ref="list"
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
            class="block rounded-lg px-3 py-2.5"
            :class="index === activeIndex ? 'bg-hover' : ''"
            tabindex="-1"
            @mouseenter="activeIndex = index"
            @click="emit('navigate')"
          >
            <div class="flex items-center gap-2">
              <AppIcon
                name="file"
                :size="15"
                class="shrink-0 text-subtle"
              />
              <span class="truncate font-medium">
                <SearchHighlight
                  :text="result.doc.title"
                  :terms="terms"
                />
              </span>
              <span class="ml-auto shrink-0 text-xs text-subtle">{{ result.doc.category }}</span>
            </div>
            <p class="mt-1 line-clamp-2 pl-[23px] text-sm leading-relaxed text-muted">
              <SearchHighlight
                :text="result.snippet"
                :terms="terms"
              />
            </p>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div
      v-if="showKeyHints"
      class="hidden items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-subtle sm:flex"
    >
      <span class="inline-flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
      <span class="inline-flex items-center gap-1"><kbd>↵</kbd> 打开</span>
      <span class="inline-flex items-center gap-1"><kbd>Esc</kbd> 关闭</span>
    </div>
  </div>
</template>
