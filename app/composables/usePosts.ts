const POST_SUMMARY_FIELDS = [
  'path',
  'title',
  'description',
  'date',
  'updated',
  'category',
  'tags',
  'readingTime',
] as const

export interface PostSummary {
  path: string
  title: string
  description: string
  date: string
  updated?: string
  category: string
  tags: string[]
  readingTime: number
}

/** 全部已发布文章的摘要列表（按发布日期倒序），在各页面间共享同一份数据。 */
export function usePostList() {
  return useAsyncData(
    'posts:summary',
    async (): Promise<PostSummary[]> => {
      const posts = await queryCollection('posts')
        .where('draft', '=', false)
        .order('date', 'DESC')
        .select(...POST_SUMMARY_FIELDS)
        .all()

      return posts.map(post => ({
        ...post,
        tags: post.tags ?? [],
        readingTime: post.readingTime ?? 1,
      }))
    },
    { default: (): PostSummary[] => [] },
  )
}
