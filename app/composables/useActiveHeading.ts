import type { MaybeRefOrGetter } from 'vue'

/** 返回当前阅读位置所在章节的标题 id（最后一个越过顶部阈值的标题），用于 TOC 高亮。 */
export function useActiveHeading(ids: MaybeRefOrGetter<string[]>) {
  const activeId = ref('')
  let frame = 0

  function update() {
    frame = 0
    let current = ''
    for (const id of toValue(ids)) {
      const element = document.getElementById(id)
      if (!element) continue
      // Share the heading's anchor offset, including the responsive header height.
      const offset = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 100
      if (element.getBoundingClientRect().top > offset + 2) break
      current = id
    }
    activeId.value = current
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    watch(() => toValue(ids), () => nextTick(update))
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })

  return activeId
}
