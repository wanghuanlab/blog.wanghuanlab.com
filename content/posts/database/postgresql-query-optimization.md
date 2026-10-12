---
title: "PostgreSQL 查询性能优化基础"
description: "从 EXPLAIN ANALYZE 读懂执行计划，掌握索引设计、统计信息与常见慢查询的优化思路。"
date: "2026-08-18"
updated: "2026-09-02"
category: "Database"
tags:
  - PostgreSQL
  - SQL
  - Performance
draft: false
---

大多数慢查询并不需要调整数据库参数，而是需要正确的索引和更合理的 SQL。本文整理 PostgreSQL 查询优化的基本方法。

## 先看执行计划

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.amount, u.name
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'PAID'
  AND o.created_at >= now() - interval '7 days'
ORDER BY o.created_at DESC
LIMIT 20;
```

重点关注：

- **实际行数与估算行数**是否相差很大（统计信息问题）
- 是否出现大表 `Seq Scan`
- `Sort` 是否使用了磁盘（`external merge`）
- `Buffers: shared read` 是否过高（缓存未命中）

### 常见扫描方式

| 节点 | 含义 | 适用场景 |
| --- | --- | --- |
| Seq Scan | 全表扫描 | 小表或需要读取大部分数据 |
| Index Scan | 按索引查找并回表 | 选择性高的条件 |
| Index Only Scan | 只读索引 | 查询列都在索引中 |
| Bitmap Heap Scan | 先收集位图再批量回表 | 中等选择性、多条件组合 |

## 索引设计

### 复合索引的列顺序

一般遵循：**等值条件在前，范围条件在后，排序列与范围列尽量一致**。

```sql
CREATE INDEX CONCURRENTLY idx_orders_status_created
    ON orders (status, created_at DESC);
```

### 部分索引

只为高频查询的数据子集建立索引，体积更小：

```sql
CREATE INDEX CONCURRENTLY idx_orders_pending
    ON orders (created_at)
    WHERE status = 'PENDING';
```

### 覆盖索引

```sql
CREATE INDEX CONCURRENTLY idx_orders_user_cover
    ON orders (user_id) INCLUDE (amount, status);
```

> 生产环境建索引请使用 `CONCURRENTLY`，避免长时间锁表；但它不能在事务块中执行，失败后需要手动清理无效索引。

## 统计信息

估算行数偏差大时，先更新统计信息：

```sql
ANALYZE orders;

-- 对数据倾斜严重的列提高统计精度
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
```

## 常见慢查询模式

1. 在索引列上使用函数：`WHERE date(created_at) = '2026-08-18'`，应改为范围条件
2. 隐式类型转换导致索引失效
3. 深分页 `OFFSET 100000`，应改为基于游标的分页
4. `SELECT *` 读取不需要的大字段

### 游标分页示例

```sql
SELECT id, amount, created_at
FROM orders
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

## 定位慢查询

```bash
# postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
log_min_duration_statement = 500
```

```sql
SELECT query, calls, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 优化检查清单

- [x] 用 `EXPLAIN (ANALYZE, BUFFERS)` 确认瓶颈
- [x] 检查索引是否被使用
- [ ] 检查统计信息是否过期
- [ ] 评估是否需要改写 SQL 或调整数据模型
