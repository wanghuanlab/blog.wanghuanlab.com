---
title: "用架构决策记录（ADR）管理技术取舍"
description: "架构设计的难点不在于选择，而在于记住为什么这样选择。ADR 是一种轻量的决策记录方法。"
date: "2026-06-10"
category: "Architecture"
tags:
  - Architecture
  - Engineering
  - Documentation
draft: false
---

一年后再看系统，最常见的问题是："当时为什么这么设计？"架构决策记录（Architecture Decision Record，ADR）用很低的成本回答这个问题。

## ADR 记录什么

每条 ADR 只记录**一个**决策，包括：

- **背景**：面临什么问题、有哪些约束
- **决策**：最终选择了什么
- **备选方案**：考虑过但没有选择的方案及原因
- **影响**：这个决策带来的好处与代价

> 好的架构不是没有缺点的架构，而是缺点被清楚认识并被接受的架构。

## 模板

```markdown
# ADR-0007: 使用 PostgreSQL 作为博客 CMS 的主存储

- 状态：已接受
- 日期：2026-06-10

## 背景
博客第二阶段需要支持在线编辑、草稿与定时发布。

## 决策
使用 PostgreSQL 存储文章与元数据，Markdown 原文以 TEXT 保存。

## 备选方案
- MySQL：团队同样熟悉，但需要 JSONB 和全文检索能力时扩展性不如 PostgreSQL
- 继续使用 Git + Markdown：无法满足在线编辑需求

## 影响
- 需要维护数据库备份
- 前端通过 API 获取内容，构建流程需要调整
```

## 状态流转

| 状态 | 含义 |
| --- | --- |
| Proposed | 提议中，等待评审 |
| Accepted | 已接受并执行 |
| Deprecated | 不再适用，但保留历史 |
| Superseded | 被新的 ADR 取代 |

## 落地建议

1. ADR 与代码放在同一个仓库，例如 `docs/adr/`
2. 文件按编号命名，**只追加不修改**；结论变化时新建 ADR 并标记旧的为 Superseded
3. 在 Code Review 中引用相关 ADR 编号
4. 不要追求完美文档，一页纸即可

```bash
mkdir -p docs/adr
cp docs/adr/template.md "docs/adr/$(printf '%04d' 8)-use-redis-for-session.md"
```
