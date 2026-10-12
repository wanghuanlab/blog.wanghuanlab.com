import { queryCollection } from '@nuxt/content/server'

type ContentEvent = Parameters<typeof queryCollection>[0]

const SKIPPED_TAGS = new Set(['style', 'script'])
const BLOCK_TAGS = new Set(['p', 'li', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'tr', 'div', 'br'])

export function getPublishedPosts(event: ContentEvent) {
  return queryCollection(event, 'posts')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all()
}

/** Minimark 节点结构：`string` 或 `[tag, props, ...children]`。 */
function minimarkToText(node: unknown): string {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return ''

  const [tag, , ...children] = node as [string, unknown, ...unknown[]]
  if (SKIPPED_TAGS.has(tag)) return ''
  const text = children.map(minimarkToText).join('')
  return BLOCK_TAGS.has(tag) ? ` ${text} ` : text
}

interface HastLike {
  type?: string
  tag?: string
  value?: string
  children?: HastLike[]
}

function hastToText(node: HastLike): string {
  if (node.type === 'text') return node.value ?? ''
  if (node.tag && SKIPPED_TAGS.has(node.tag)) return ''
  const text = (node.children ?? []).map(hastToText).join('')
  return node.tag && BLOCK_TAGS.has(node.tag) ? ` ${text} ` : text
}

/** 将文章 AST 转为纯文本，供搜索索引与 RSS 使用。 */
export function bodyToText(body: unknown): string {
  if (!body || typeof body !== 'object') return ''

  const tree = body as { type?: string, value?: unknown[], children?: HastLike[] }
  const text = tree.type === 'minimark'
    ? (tree.value ?? []).map(minimarkToText).join('')
    : (tree.children ?? []).map(hastToText).join('')

  return text.replace(/\s+/g, ' ').trim()
}

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;',
}

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, char => XML_ENTITIES[char] ?? char)
}
