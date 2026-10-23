<script setup lang="ts">
const { data: page } = await useAsyncData('page:about', () => queryCollection('pages').path('/about').first())

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
}

usePageSeo(() => ({
  title: page.value!.title,
  description: page.value!.description,
  path: '/about',
}))
</script>

<template>
  <div class="container-narrow page-shell">
    <PageHeader
      :title="page!.title"
      :description="page!.description"
    />
    <article class="about-content">
      <ContentRenderer
        :value="page!"
        class="prose"
      />
    </article>
  </div>
</template>

<style scoped>
.about-content {
  max-width: 43rem;
}

.about-content :deep(.prose > :first-child) {
  margin-top: 0;
}

.about-content :deep(td a) {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  overflow-wrap: anywhere;
}
</style>
