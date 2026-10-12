import type { SearchDocument } from '#shared/types/search'

/** 全局搜索弹窗的开关状态。 */
export function useSearchDialog() {
  const isOpen = useState('search:open', () => false)

  return {
    isOpen,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    },
    toggle: () => {
      isOpen.value = !isOpen.value
    },
  }
}

/** 懒加载构建期生成的本地搜索索引，仅在首次搜索时请求一次。 */
export function useSearchIndex() {
  const documents = useState<SearchDocument[] | null>('search:index', () => null)
  const status = useState<'idle' | 'loading' | 'ready' | 'error'>('search:status', () => 'idle')

  async function load() {
    if (status.value === 'loading' || status.value === 'ready') return
    status.value = 'loading'
    try {
      documents.value = await $fetch<SearchDocument[]>('/api/search.json')
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  return { documents, status, load }
}
