---
title: "Apache Flink 架构基础"
description: "理解 Flink 的 JobManager、TaskManager、Slot、算子链与 Checkpoint 机制，为编写可靠的流处理作业打好基础。"
date: "2026-09-05"
category: "Big Data"
tags:
  - Flink
  - Kafka
  - Stream Processing
draft: false
---

Apache Flink 是一个面向有状态流处理的分布式计算引擎。理解它的运行时架构，是排查反压、调优并行度和保障一致性的前提。

## 运行时组件

![Flink 数据处理流程示意](/images/posts/placeholder-pipeline.svg){width="1200" height="420"}

| 组件 | 职责 |
| --- | --- |
| JobManager | 作业调度、Checkpoint 协调、故障恢复 |
| TaskManager | 执行具体算子任务，提供 Task Slot |
| Task Slot | TaskManager 中的资源单元，隔离托管内存 |
| ResourceManager | 申请与释放 TaskManager 资源 |
| Dispatcher | 接收作业提交、启动 JobMaster |

### 并行度与 Slot

一个作业所需的 Slot 数量，默认等于作业中**最大的算子并行度**（同一 Slot 共享组内的子任务可以共享一个 Slot）。

```text
Source(4) -> Map(4) -> KeyBy/Window(8) -> Sink(2)
所需 Slot 数 = max(4, 4, 8, 2) = 8
```

### 算子链

满足条件的相邻算子会被合并为一个 Task，在同一线程中执行，减少序列化与网络传输：

- 上下游并行度相同
- 数据分区方式为 forward
- 处于同一 Slot 共享组

## 一个最小的 Kafka 流作业

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60_000, CheckpointingMode.EXACTLY_ONCE);

KafkaSource<String> source = KafkaSource.<String>builder()
    .setBootstrapServers("kafka:9092")
    .setTopics("orders")
    .setGroupId("order-aggregator")
    .setStartingOffsets(OffsetsInitializer.committedOffsets(OffsetResetStrategy.EARLIEST))
    .setValueOnlyDeserializer(new SimpleStringSchema())
    .build();

env.fromSource(source, WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(5)), "orders")
    .map(OrderEvent::parse)
    .keyBy(OrderEvent::userId)
    .window(TumblingEventTimeWindows.of(Duration.ofMinutes(1)))
    .sum("amount")
    .print();

env.execute("order-aggregator");
```

## Checkpoint 机制

Flink 基于 Chandy-Lamport 分布式快照算法的变体实现一致性：

1. JobManager 向 Source 注入 **Barrier**
2. Barrier 随数据流向下游传播
3. 算子收到所有输入的 Barrier 后，对状态做快照
4. 所有算子完成后，本次 Checkpoint 才算成功

> Exactly-Once 只保证 Flink 内部状态的一致性。端到端 Exactly-Once 还需要 Source 可重放、Sink 支持事务或幂等写入。

### 常用配置

```yaml
execution.checkpointing.interval: 60s
execution.checkpointing.mode: EXACTLY_ONCE
execution.checkpointing.timeout: 10min
state.backend.type: rocksdb
state.checkpoints.dir: s3://flink/checkpoints
state.backend.incremental: true
```

## 小结

- JobManager 负责"管"，TaskManager 负责"干"
- Slot 是资源隔离单元，并行度决定资源需求
- Checkpoint 是容错的核心，端到端一致性需要上下游共同配合
