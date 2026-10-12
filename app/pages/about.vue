<script setup lang="ts">
const { data: page } = await useAsyncData('page:about', () => queryCollection('pages').path('/about').first())

if (!page.value) {
  throw createError({ status: 404, statusText: 'Page Not Found', fatal: true })
}

usePageSeo(() => ({
  title: page.value!.title,
  description: page.value!.description,
  path: '/about',
}))
</script>

<template>
  <div class="container-narrow py-12">
    <PageHeader
      :title="page!.title"
      :description="page!.description"
    />
    <ContentRenderer
      :value="page!"
      class="prose"
    />
  </div>
</template>
