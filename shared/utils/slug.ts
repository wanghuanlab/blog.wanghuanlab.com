const SYMBOL_REPLACEMENTS: Record<string, string> = {
  '+': ' plus ',
  '#': ' sharp ',
  '&': ' and ',
}

/**
 * 将分类、标签名称转换为 URL 安全的 slug。
 * 保留 Unicode 字母与数字（中文标签可直接使用），其他字符折叠为 `-`。
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[+#&]/g, char => SYMBOL_REPLACEMENTS[char] ?? char)
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
