<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-elevated focus:px-4 focus:py-3"
    >跳到正文</a>
    <AppHeader />
    <main
      id="main"
      class="flex-1"
      tabindex="-1"
    >
      <slot />
    </main>
    <AppFooter />
    <SearchDialog />
    <BackToTop />
  </div>
</template>
