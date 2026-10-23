import { parseDateParts } from './date'
import { slugify } from './slug'

export interface TaxonomyPost {
  path: string
  date: string
  category: string
  tags?: string[]
}

export interface Term {
  name: string
  slug: string
  count: number
}

/** Keep SSR and browser ordering identical regardless of their default locale or ICU version. */
export function compareTermNames(a: Pick<Term, 'name'>, b: Pick<Term, 'name'>): number {
  const first = a.name.toLowerCase()
  const second = b.name.toLowerCase()
  if (first !== second) return first < second ? -1 : 1
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

export interface ArchiveMonth<T> {
  month: number
  posts: T[]
}

export interface ArchiveYear<T> {
  year: number
  count: number
  months: ArchiveMonth<T>[]
}

function countTerms(names: string[]): Term[] {
  const terms = new Map<string, Term>()

  for (const name of names) {
    const slug = slugify(name)
    if (!slug) continue
    const term = terms.get(slug)
    if (term) {
      term.count++
    }
    else {
      terms.set(slug, { name, slug, count: 1 })
    }
  }

  return [...terms.values()].sort((a, b) => b.count - a.count || compareTermNames(a, b))
}

export function collectCategories(posts: TaxonomyPost[]): Term[] {
  return countTerms(posts.map(post => post.category))
}

export function collectTags(posts: TaxonomyPost[]): Term[] {
  return countTerms(posts.flatMap(post => post.tags ?? []))
}

export function filterByCategory<T extends TaxonomyPost>(posts: T[], slug: string): T[] {
  return posts.filter(post => slugify(post.category) === slug)
}

export function filterByTag<T extends TaxonomyPost>(posts: T[], slug: string): T[] {
  return posts.filter(post => post.tags?.some(tag => slugify(tag) === slug))
}

/** 按年份、月份分组；输入需已按日期倒序排列。 */
export function groupByArchive<T extends TaxonomyPost>(posts: T[]): ArchiveYear<T>[] {
  const years: ArchiveYear<T>[] = []

  for (const post of posts) {
    const { year, month } = parseDateParts(post.date)
    let yearGroup = years.at(-1)
    if (yearGroup?.year !== year) {
      yearGroup = { year, count: 0, months: [] }
      years.push(yearGroup)
    }
    let monthGroup = yearGroup.months.at(-1)
    if (monthGroup?.month !== month) {
      monthGroup = { month, posts: [] }
      yearGroup.months.push(monthGroup)
    }
    monthGroup.posts.push(post)
    yearGroup.count++
  }

  return years
}

/** 相关文章：共享标签数量优先，同分类加权，最后按发布时间排序。 */
export function findRelatedPosts<T extends TaxonomyPost>(current: TaxonomyPost, posts: T[], limit: number): T[] {
  const currentTags = new Set((current.tags ?? []).map(slugify))
  const currentCategory = slugify(current.category)

  return posts
    .filter(post => post.path !== current.path)
    .map((post) => {
      const sharedTags = (post.tags ?? []).filter(tag => currentTags.has(slugify(tag))).length
      const sameCategory = slugify(post.category) === currentCategory ? 1 : 0
      return { post, score: sharedTags * 2 + sameCategory * 3 }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map(item => item.post)
}
