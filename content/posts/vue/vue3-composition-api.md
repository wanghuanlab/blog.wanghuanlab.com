---
title: "Vue 3 Composition API 实践"
description: "通过可复用的组合式函数组织业务逻辑，并总结 ref、computed、watch 的使用边界与 TypeScript 类型实践。"
date: "2026-07-26"
category: "Frontend"
tags:
  - Vue
  - TypeScript
  - Composition API
draft: false
---

Composition API 的核心价值不是"换一种写法"，而是让逻辑可以按**关注点**而不是按选项类型组织，并通过组合式函数（Composables）复用。

## 选项式与组合式的对比

| 维度 | Options API | Composition API |
| --- | --- | --- |
| 代码组织 | 按 data / methods / computed 分散 | 按功能聚合 |
| 逻辑复用 | Mixins（命名冲突、来源不清） | Composables（显式导入） |
| TypeScript | 类型推导较弱 | 类型推导自然 |
| 学习成本 | 较低 | 需要理解响应式原理 |

## 一个组合式函数

封装"带取消能力的分页请求"：

```typescript
import { ref, watch, type Ref } from 'vue'

export interface Page<T> {
  items: T[]
  total: number
}

export function usePagedQuery<T>(
  fetcher: (page: number, signal: AbortSignal) => Promise<Page<T>>,
  page: Ref<number>,
) {
  const data = ref<Page<T>>({ items: [], total: 0 }) as Ref<Page<T>>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  let controller: AbortController | undefined

  async function load() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher(page.value, controller.signal)
    }
    catch (e) {
      if (!controller.signal.aborted) error.value = e as Error
    }
    finally {
      loading.value = false
    }
  }

  watch(page, load, { immediate: true })

  return { data, loading, error, reload: load }
}
```

在组件中使用：

```vue
<script setup lang="ts">
const page = ref(1)
const { data, loading } = usePagedQuery(
  (current, signal) => $fetch('/api/users', { query: { page: current }, signal }),
  page,
)
</script>

<template>
  <UserTable :items="data.items" :loading="loading" />
  <Pagination v-model="page" :total="data.total" />
</template>
```

## 使用边界

### ref 还是 reactive

- 优先使用 `ref`：可以整体替换、解构不丢响应性
- `reactive` 适合结构固定、不会整体替换的表单对象

### computed 还是 watch

> 能用 `computed` 推导的状态，就不要用 `watch` 去同步另一个 `ref`。

`watch` 适合处理**副作用**：请求接口、写入本地存储、操作 DOM。

```typescript
// 不推荐：用 watch 同步派生状态
watch(items, (value) => { total.value = value.length })

// 推荐：直接推导
const total = computed(() => items.value.length)
```

## 组织建议

1. 组件内逻辑超过 100 行时，考虑抽取 Composable
2. Composable 以 `use` 开头，返回明确的对象而不是数组
3. 副作用在 `onBeforeUnmount` 中清理（定时器、监听器、请求）
4. 跨组件共享状态优先考虑 `provide / inject` 或 Pinia，而不是模块级变量（SSR 下会被多个请求共享）

## 小结

Composition API 让逻辑复用变得自然，但也更依赖开发者的组织能力。保持 Composable 职责单一、输入输出清晰，是长期可维护的关键。
