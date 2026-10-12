<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2 focus:shadow"
    >跳到正文</a>
    <AppHeader />
    <main
      id="main"
      class="flex-1"
    >
      <slot />
    </main>
    <AppFooter />
    <SearchDialog />
    <BackToTop />
  </div>
</template>
