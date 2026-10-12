import type { SearchDocument } from '#shared/types/search'

const MAX_CONTENT_LENGTH = 8000

export default defineEventHandler(async (event): Promise<SearchDocument[]> => {
  const posts = await getPublishedPosts(event)

  return posts.map(post => ({
    path: post.path,
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags ?? [],
    date: post.date,
    content: bodyToText(post.body).slice(0, MAX_CONTENT_LENGTH),
  }))
})
