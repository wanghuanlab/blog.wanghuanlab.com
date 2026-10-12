---
title: "Java 21 新特性概览"
description: "梳理 Java 21 LTS 中最值得关注的语言与平台特性：虚拟线程、Record Patterns、switch 模式匹配、Sequenced Collections 等。"
date: "2026-09-20"
updated: "2026-10-10"
category: "Java"
tags:
  - Java
  - JDK 21
  - Virtual Threads
  - Concurrency
draft: false
---

Java 21 是继 Java 17 之后的又一个 LTS 版本。本文按"是否值得立即使用"的视角梳理主要特性，同时作为本站 Markdown 渲染能力的完整示例。

## 特性总览

| JEP | 特性 | 状态 | 建议 |
| --- | --- | --- | --- |
| 444 | Virtual Threads | 正式 | I/O 密集型服务优先评估 |
| 440 | Record Patterns | 正式 | 可直接使用 |
| 441 | Pattern Matching for switch | 正式 | 可直接使用 |
| 431 | Sequenced Collections | 正式 | 可直接使用 |
| 430 | String Templates | 预览 | 不建议用于生产（后续版本已撤回） |
| 453 | Structured Concurrency | 预览 | 关注即可 |

## 虚拟线程

虚拟线程（Virtual Threads）由 JVM 调度，创建成本极低，适合"一个请求一个线程"的阻塞式编程模型。

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i ->
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        })
    );
}
```

在 Spring Boot 3.2+ 中只需一行配置即可启用：

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

> **注意**：虚拟线程并不会让 CPU 密集型任务变快。它解决的是线程数量受限导致的吞吐瓶颈，而不是单个任务的执行速度。

### 使用时的几个坑

1. 在 `synchronized` 块中执行阻塞 I/O 会导致虚拟线程 *pinning*，JDK 24 之前应优先改用 `ReentrantLock`
2. 不要池化虚拟线程，它本身就是廉价资源
3. `ThreadLocal` 在海量虚拟线程下可能带来内存压力

### 排查 pinning

```bash
java -Djdk.tracePinnedThreads=full -jar app.jar
```

## Record Patterns 与 switch 模式匹配

两者结合，可以写出接近代数数据类型风格的代码：

```java
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

static double area(Shape shape) {
    return switch (shape) {
        case Circle(double r) -> Math.PI * r * r;
        case Rectangle(double w, double h) when w == h -> w * w;
        case Rectangle(double w, double h) -> w * h;
    };
}
```

由于 `Shape` 是 `sealed` 接口，编译器能检查 `switch` 是否穷尽，无需 `default` 分支。

## Sequenced Collections

新增的 `SequencedCollection` 接口统一了"有序集合"的首尾访问：

- `getFirst()` / `getLast()`
- `addFirst()` / `addLast()`
- `reversed()`

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getLast();          // "c"
list.reversed();         // [c, b, a]
```

## 升级检查清单

- [x] 构建工具升级（Maven 3.9+ / Gradle 8.5+）
- [x] Spring Boot 升级到 3.2 及以上
- [ ] 评估第三方依赖对 JDK 21 的兼容性
- [ ] 在压测环境验证虚拟线程收益

## Markdown 渲染示例

以下内容用于验证排版细节。

### 标题层级

#### 四级标题

##### 五级标题

###### 六级标题

这是一段包含 **粗体**、*斜体*、~~删除线~~、`行内代码` 与 [外部链接](https://openjdk.org/projects/jdk/21/) 的文字，以及一个 [站内链接](/posts/database/postgresql-query-optimization)。

- 无序列表
  - 嵌套项 A
  - 嵌套项 B
- 另一项

![架构示意图占位](/images/posts/placeholder-architecture.svg){width="1200" height="560"}

```json
{
  "jdk": 21,
  "lts": true,
  "features": ["virtual-threads", "record-patterns"]
}
```

---

参考资料：[JDK 21 Release Notes](https://jdk.java.net/21/release-notes)
