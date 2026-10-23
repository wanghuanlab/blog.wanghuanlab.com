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
  <div class="container-narrow page-shell">
    <PageHeader
      title="归档"
      :description="`每一次记录，都是一个问题的解答。这里收录了 ${posts.length} 篇文章，按时间倒序排列。`"
    />
    <section
      v-for="year in archives"
      :key="year.year"
      class="archive-year"
      :aria-labelledby="`year-${year.year}`"
    >
      <h2
        :id="`year-${year.year}`"
        class="archive-year-heading"
      >
        {{ year.year }}
        <span class="archive-count">{{ year.count }} 篇</span>
      </h2>
      <div
        v-for="month in year.months"
        :key="month.month"
        class="archive-month"
      >
        <h3 class="archive-month-heading">
          {{ monthName(month.month) }}
        </h3>
        <ul class="archive-entries">
          <li
            v-for="post in month.posts"
            :key="post.path"
          >
            <NuxtLink
              :to="post.path"
              class="archive-link"
            >
              <time
                :datetime="post.date"
                class="archive-day"
              >{{ day(post.date) }}</time>
              <span>{{ post.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
    <p
      v-if="!archives.length"
      class="py-8 text-muted"
    >
      还没有发布文章。新的记录会从这里开始。
    </p>
  </div>
</template>

<style scoped>
.archive-year + .archive-year {
  margin-top: 3.75rem;
}

.archive-year-heading {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 1.2rem;
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.archive-count {
  color: var(--subtle);
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0;
}

.archive-month {
  padding-top: 1.5rem;
}

.archive-month-heading {
  margin-bottom: 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.archive-link {
  display: flex;
  min-height: 3rem;
  align-items: baseline;
  gap: 1.15rem;
  margin-inline: -0.75rem;
  padding: 0.7rem 0.75rem;
  line-height: 1.6;
  transition: color 160ms ease, background-color 160ms ease;
}

.archive-link:hover {
  background-color: var(--surface);
  color: var(--accent);
}

.archive-day {
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--subtle);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 640px) {
  .archive-month {
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr);
    gap: 1rem;
  }

  .archive-month-heading {
    padding-top: 0.85rem;
  }
}
</style>
