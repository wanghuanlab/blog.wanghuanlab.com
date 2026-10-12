const CJK_CHARS_PER_MINUTE = 400
const WORDS_PER_MINUTE = 220

const FRONT_MATTER = /^---[\s\S]*?\n---/
const CJK = /[\u3400-\u9FFF\uF900-\uFAFF]/g
const LATIN_WORD = /[A-Za-z0-9_]+(?:['.-][A-Za-z0-9_]+)*/g

/** 根据 Markdown 原文估算阅读分钟数（中英文混排）。 */
export function estimateReadingTime(markdown: string): number {
  const text = markdown.replace(FRONT_MATTER, '')
  const cjkCount = text.match(CJK)?.length ?? 0
  const wordCount = text.replace(CJK, ' ').match(LATIN_WORD)?.length ?? 0
  const minutes = cjkCount / CJK_CHARS_PER_MINUTE + wordCount / WORDS_PER_MINUTE

  return Math.max(1, Math.ceil(minutes))
}
