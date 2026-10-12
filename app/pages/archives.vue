<script setup lang="ts">
const { data: posts } = await usePostList()
const archives = computed(() => groupByArchive(posts.value))

function day(date: string): string {
  return String(parseDateParts(date).day).padStart(2, '0')
}

usePageSeo({
  title: '归档',
  description: '按年份与月份浏览全部文章。',
  path: '/archives',
})
</script>

<template>
  <div class="container-narrow py-12">
    <PageHeader
      title="归档"
      :description="`共 ${posts.length} 篇文章。`"
    />
    <section
      v-for="year in archives"
      :key="year.year"
      class="mb-12 last:mb-0"
      :aria-labelledby="`year-${year.year}`"
    >
      <h2
        :id="`year-${year.year}`"
        class="flex items-baseline gap-3 text-2xl font-semibold tracking-tight"
      >
        {{ year.year }}
        <span class="font-mono text-sm font-normal text-subtle">{{ year.count }} 篇</span>
      </h2>
      <div
        v-for="month in year.months"
        :key="month.month"
        class="mt-6"
      >
        <h3 class="mb-2 text-sm font-medium text-muted">
          {{ monthName(month.month) }}
        </h3>
        <ul class="border-l border-border">
          <li
            v-for="post in month.posts"
            :key="post.path"
          >
            <NuxtLink
              :to="post.path"
              class="group -ml-px flex items-baseline gap-4 border-l border-transparent py-2 pl-4 transition-colors hover:border-accent"
            >
              <time
                :datetime="post.date"
                class="w-6 shrink-0 font-mono text-sm text-subtle"
              >{{ day(post.date) }}</time>
              <span class="leading-snug group-hover:text-accent">{{ post.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
