---
title: "从零理解 RAG"
description: "RAG（检索增强生成）的基本流程、关键环节与常见问题：文档切分、向量检索、重排序与评估。"
date: "2026-10-08"
category: "AI"
tags:
  - LLM
  - RAG
  - Embedding
  - PostgreSQL
draft: false
---

大语言模型的知识有截止时间，也不了解企业内部数据。RAG（Retrieval-Augmented Generation）通过"先检索、再生成"的方式，让模型基于给定资料回答问题。

## 基本流程

![RAG 流程示意](/images/posts/placeholder-pipeline.svg){width="1200" height="420"}

RAG 可以拆成离线和在线两个阶段：

**离线索引**

1. 加载文档（PDF、Markdown、网页、数据库）
2. 清洗与切分（Chunking）
3. 计算向量（Embedding）
4. 写入向量库

**在线问答**

1. 将用户问题向量化
2. 检索 Top-K 相关片段
3. 重排序（Rerank）
4. 拼接 Prompt 并调用 LLM 生成答案

## 关键环节

### 文档切分

切分粒度直接影响召回质量：

| 策略 | 优点 | 缺点 |
| --- | --- | --- |
| 固定长度 | 实现简单 | 容易截断语义 |
| 按段落 / 标题 | 保留结构 | 块大小不均 |
| 语义切分 | 语义完整 | 计算成本高 |

通常建议从"按标题切分 + 长度上限 + 少量重叠"开始。

```python
from dataclasses import dataclass

@dataclass
class Chunk:
    text: str
    source: str
    heading: str

def split_markdown(text: str, source: str, max_chars: int = 800, overlap: int = 100) -> list[Chunk]:
    chunks: list[Chunk] = []
    heading = ""
    buffer = ""
    for line in text.splitlines():
        if line.startswith("#"):
            heading = line.lstrip("# ").strip()
        buffer += line + "\n"
        if len(buffer) >= max_chars:
            chunks.append(Chunk(buffer.strip(), source, heading))
            buffer = buffer[-overlap:]
    if buffer.strip():
        chunks.append(Chunk(buffer.strip(), source, heading))
    return chunks
```

### 向量存储

如果团队已经在使用 PostgreSQL，`pgvector` 是一个低成本的起点：

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE doc_chunks (
    id         BIGSERIAL PRIMARY KEY,
    source     TEXT NOT NULL,
    content    TEXT NOT NULL,
    embedding  VECTOR(1024) NOT NULL
);

CREATE INDEX ON doc_chunks USING hnsw (embedding vector_cosine_ops);

SELECT id, source, content
FROM doc_chunks
ORDER BY embedding <=> $1
LIMIT 5;
```

### Prompt 组装

```typescript
interface RetrievedChunk {
  source: string
  content: string
}

function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] (${chunk.source})\n${chunk.content}`)
    .join('\n\n')

  return [
    '请仅根据以下资料回答问题；如果资料中没有答案，请明确说明。',
    `资料：\n${context}`,
    `问题：${question}`,
  ].join('\n\n')
}
```

## 常见问题

> RAG 效果不好时，先检查检索结果是否正确，再调整 Prompt。大多数问题出在"没检索到"而不是"没答好"。

- **召回不准**：尝试混合检索（关键词 BM25 + 向量），并引入 Rerank 模型
- **上下文过长**：控制 Top-K，或先做摘要压缩
- **答案幻觉**：要求模型引用来源编号，并在无依据时拒答
- **数据更新**：为文档维护版本与更新时间，支持增量重建索引

## 评估指标

- [x] 检索命中率（Hit Rate / Recall@K）
- [x] 答案忠实度（Faithfulness）
- [ ] 答案相关性（Answer Relevancy）
- [ ] 端到端延迟与成本

## 小结

RAG 本质上是一个"搜索系统 + 生成模型"的组合。把检索环节当作搜索工程认真对待，往往比更换更大的模型收益更高。
