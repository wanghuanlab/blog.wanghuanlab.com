import type { SearchDocument } from '#shared/types/search'

export interface PreparedDocument {
  doc: SearchDocument
  title: string
  description: string
  taxonomy: string
  content: string
}

export interface SearchResult {
  doc: SearchDocument
  score: number
  snippet: string
}

export interface TextSegment {
  text: string
  match: boolean
}

const FIELD_WEIGHTS = {
  title: 10,
  taxonomy: 6,
  description: 4,
  content: 1,
} as const

const SNIPPET_BEFORE = 30
const SNIPPET_LENGTH = 140

export function tokenize(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))]
}

export function prepareDocuments(documents: SearchDocument[]): PreparedDocument[] {
  return documents.map(doc => ({
    doc,
    title: doc.title.toLowerCase(),
    description: doc.description.toLowerCase(),
    taxonomy: [doc.category, ...doc.tags].join(' ').toLowerCase(),
    content: doc.content.toLowerCase(),
  }))
}

function buildSnippet(item: PreparedDocument, terms: string[]): string {
  const positions = terms.map(term => item.content.indexOf(term)).filter(index => index >= 0)
  if (!positions.length) return item.doc.description

  const start = Math.max(0, Math.min(...positions) - SNIPPET_BEFORE)
  const text = item.doc.content.slice(start, start + SNIPPET_LENGTH).trim()
  return `${start > 0 ? '…' : ''}${text}${start + SNIPPET_LENGTH < item.doc.content.length ? '…' : ''}`
}

/** 多关键词 AND 匹配：每个关键词必须命中至少一个字段，按字段权重累计得分。 */
export function searchDocuments(items: PreparedDocument[], query: string, limit = 20): SearchResult[] {
  const terms = tokenize(query)
  if (!terms.length) return []

  const results: SearchResult[] = []

  for (const item of items) {
    let score = 0
    let matchedAll = true

    for (const term of terms) {
      let termScore = 0
      if (item.title.includes(term)) termScore += FIELD_WEIGHTS.title
      if (item.taxonomy.includes(term)) termScore += FIELD_WEIGHTS.taxonomy
      if (item.description.includes(term)) termScore += FIELD_WEIGHTS.description
      if (item.content.includes(term)) termScore += FIELD_WEIGHTS.content
      if (!termScore) {
        matchedAll = false
        break
      }
      score += termScore
    }

    if (matchedAll) {
      results.push({ doc: item.doc, score, snippet: buildSnippet(item, terms) })
    }
  }

  return results
    .sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date))
    .slice(0, limit)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 将文本按关键词切分为片段，供模板安全地渲染高亮（不使用 v-html）。 */
export function highlightSegments(text: string, terms: string[]): TextSegment[] {
  if (!terms.length) return [{ text, match: false }]

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return text
    .split(pattern)
    .filter(Boolean)
    .map(part => ({ text: part, match: terms.includes(part.toLowerCase()) }))
}
