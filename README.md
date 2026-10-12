# WangHuan Lab Blog

> Software · Architecture · AI · Engineering

个人技术博客 [blog.wanghuanlab.com](https://blog.wanghuanlab.com) 的源码。记录软件工程、系统架构、AI、大数据与工程实践。

文章使用 Markdown 维护，构建时全部页面静态预渲染（SSG），生成纯静态产物（HTML / CSS / JS），直接由生产服务器的 1Panel / OpenResty 高性能静态托管。

## 功能

- 首页、文章列表、文章详情、分类、标签、归档、关于、搜索、自定义 404
- Markdown：GFM 表格 / 任务列表 / 引用 / 图片懒加载 / 标题锚点，Shiki 代码高亮（显示语言、Copy 按钮、横向滚动、深色主题）
- 文章详情：发布与更新时间、分类、标签、阅读时间、桌面端固定目录 + 当前章节高亮、移动端可展开目录、上一篇 / 下一篇、相关文章、返回顶部
- 本地全文搜索：构建期预渲染生成索引 `/api/search.json`，支持标题、摘要、正文、分类、标签；`⌘K` / `Ctrl K` 打开，键盘上下选择、回车打开
- 主题：Light / Dark / System，选择保存在 localStorage，无闪烁
- SEO：title、description、canonical、Open Graph、Twitter Card、JSON-LD、`robots.txt`、`sitemap.xml`、`rss.xml`
- 草稿：`draft: true` 的文章不会出现在任何页面、搜索、RSS 与 Sitemap 中

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Nuxt 4（Vue 3、Composition API、TypeScript） |
| 内容 | Nuxt Content 3（Markdown，构建期使用 Node 内置 `node:sqlite`） |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`），自定义正文排版 |
| 主题 | `@nuxtjs/color-mode` |
| 质量 | ESLint（`@nuxt/eslint`）、`vue-tsc` |
| 包管理 | pnpm 11 |

> 为什么是 Nuxt 4：Nuxt 3 已于 2026 年进入 EOL。Nuxt 4 是其直接后续版本，写法与 Nuxt 3 基本一致（主要区别是源码位于 `app/` 目录）。

## 环境要求

- Node.js **>= 22.5**（推荐 24 LTS，需要内置 `node:sqlite`）
- pnpm **11**（`npm i -g pnpm@11` 或 `corepack enable`）

## 快速开始

```bash
pnpm install      # 安装依赖（会自动执行 nuxt prepare）
pnpm dev          # 本地开发 http://localhost:3000
```

常用命令：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发，支持热更新 |
| `pnpm generate` | 生产环境静态预渲染（SSG），生成全站纯静态产物到 `.output/public/` |
| `pnpm build` | 服务端构建（含预渲染） |
| `pnpm preview` | 预览本地构建产物 |
| `pnpm lint` / `pnpm lint:fix` | ESLint 检查 / 自动修复 |
| `pnpm typecheck` | TypeScript 类型检查 |

## 目录结构

```text
.
├── app/
│   ├── assets/css/          # 全局样式与设计 token（main.css）、正文排版（prose.css）
│   ├── components/
│   │   ├── content/         # Markdown 渲染覆盖：ProsePre、ProseImg、ProseTable 等
│   │   ├── post/            # 文章列表、元信息、标签、目录、上下篇、相关文章
│   │   └── search/          # 搜索弹窗、搜索面板、关键词高亮
│   ├── composables/         # usePosts、usePageSeo、useSearch、useActiveHeading
│   ├── layouts/default.vue
│   ├── pages/               # 路由页面
│   ├── utils/search.ts      # 搜索打分与高亮（纯函数）
│   └── error.vue            # 404 / 错误页
├── config/site.ts           # 站点信息唯一配置入口
├── content/
│   ├── pages/about.md       # 关于页面
│   └── posts/<分组>/*.md     # 文章
├── server/
│   ├── api/search.json.get.ts # 构建期预渲染生成 /api/search.json 索引
│   ├── routes/              # 构建期预渲染生成 rss.xml、sitemap.xml、robots.txt
│   └── utils/posts.ts
├── shared/                  # 前后端共用的工具函数与类型（slug、日期、分类聚合、阅读时间）
├── public/                  # favicon、默认 OG 图片、文章静态资源
├── content.config.ts        # 内容集合与 Front Matter schema
├── nuxt.config.ts           # Nuxt 与 Nitro 预渲染配置
└── package.json
```

## 站点配置

站点名称、简介、域名、作者、GitHub、邮箱、社交链接、导航、分类描述等统一在 [`config/site.ts`](config/site.ts) 中维护。组件、SEO、RSS、Sitemap 均从这里读取。

## 新增文章

在 `content/posts/` 下任意子目录（按主题分组，例如 `java/`、`ai/`）新建 `.md` 文件。**文件路径即 URL**：

```text
content/posts/java/java-21-features.md  →  /posts/java/java-21-features
```

Front Matter 规范：

```yaml
---
title: "Spring Boot 项目服务注册与配置中心选型"   # 必填
description: "介绍 Nacos、Consul、Kubernetes 等方案的选型思路"  # 必填，用于摘要与 SEO
date: "2026-10-12"          # 必填，发布日期，YYYY-MM-DD（请加引号）
updated: "2026-10-12"       # 可选，更新日期
category: "Java"            # 必填，单个分类
tags:                       # 可选
  - Spring Boot
  - Nacos
draft: false                # 可选，true 时不发布
cover: "/images/posts/xxx.png"  # 可选，作为该文的 Open Graph 图片
---
```

写作约定：

- 正文从 `##` 开始，页面标题由 `title` 渲染为 `<h1>`；目录（TOC）包含 `##` 与 `###`。
- 分类与标签的 URL 由名称自动生成：`Big Data` → `/categories/big-data`，`Spring Boot` → `/tags/spring-boot`。
- 新分类可在 `config/site.ts` 的 `categoryDescriptions` 中补充描述。
- 图片放在 `public/images/posts/`，建议声明尺寸以避免布局偏移：

  ```markdown
  ![架构图](/images/posts/arch.png){width="1200" height="600"}
  ```

- 代码块请标注语言。如需新增高亮语言，在 `nuxt.config.ts` 的 `content.build.markdown.highlight.langs` 中添加。
- 修改 `nuxt.config.ts` 中的 Markdown 配置（如高亮主题、TOC 深度）后，建议先清除内容缓存再构建：`rm -rf .data && pnpm generate`。

## 生产部署（SSG 静态托管方案）

本项目为纯静态 SSG 架构，所有页面（包括 `/rss.xml`、`/sitemap.xml`、`/robots.txt`、`/api/search.json`）均在本地构建时生成完毕。

服务器上已通过 **1Panel** 创建了静态站点，并由 **OpenResty / Nginx** 提供 HTTPS 服务。

### 1. 生产环境参数

| 项目 | 参数 | 说明 |
| :--- | :--- | :--- |
| **线上访问域名** | `https://blog.wanghuanlab.com` | 已配置 HTTPS 证书 |
| **远端 SSH 主机** | `root@blog.wanghuanlab.com` | 支持 SSH 登录 |
| **远端静态站点目录** | `/opt/1panel/www/sites/blog.wanghuanlab.com/index` | Nginx 挂载的前端根目录 |
| **本地静态产物目录** | `.output/public` | 执行 `pnpm generate` 生成 |

### 2. 部署步骤

1. **本地执行生产静态预渲染**：
   ```bash
   pnpm generate
   ```
   该命令会在 `.output/public/` 下生成完整的静态 HTML、CSS、JS、静态资产以及预渲染文件。

2. **备份远端旧版本并同步发布**：
   ```bash
   # 1. 在服务器创建当前版本的带时间戳备份
   ssh root@blog.wanghuanlab.com "cp -r /opt/1panel/www/sites/blog.wanghuanlab.com/index /opt/1panel/www/sites/blog.wanghuanlab.com/index.backup-\$(date +%Y%m%d%H%M%S) 2>/dev/null || true"

   # 2. 增量安全同步最新静态产物至生产站点根目录
   rsync -avz --delete .output/public/ root@blog.wanghuanlab.com:/opt/1panel/www/sites/blog.wanghuanlab.com/index/
   ```

3. **线上验证**：
   ```bash
   curl -I https://blog.wanghuanlab.com/
   curl -I https://blog.wanghuanlab.com/rss.xml
   ```

## 已知限制

- 文章列表暂未分页，文章数量较多时再按需增加。
- 搜索为客户端关键词匹配（多关键词 AND），不支持分词与拼写纠错；索引中每篇正文截取前 8000 字。
- 阅读时间为估算值（中文约 400 字/分钟，英文约 220 词/分钟）。
