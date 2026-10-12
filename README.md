# WangHuan Lab Blog

> Software · Architecture · AI · Engineering

个人技术博客 [blog.wanghuanlab.com](https://blog.wanghuanlab.com) 的源码。记录软件工程、系统架构、AI、大数据与工程实践。

文章使用 Markdown 维护，构建时全部页面静态预渲染（SSG），由 Node 服务（Nitro）托管，Nginx 反向代理对外提供服务。

## 功能

- 首页、文章列表、文章详情、分类、标签、归档、关于、搜索、自定义 404
- Markdown：GFM 表格 / 任务列表 / 引用 / 图片懒加载 / 标题锚点，Shiki 代码高亮（显示语言、Copy 按钮、横向滚动、深色主题）
- 文章详情：发布与更新时间、分类、标签、阅读时间、桌面端固定目录 + 当前章节高亮、移动端可展开目录、上一篇 / 下一篇、相关文章、返回顶部
- 本地全文搜索：构建期生成索引 `/api/search.json`，支持标题、摘要、正文、分类、标签；`⌘K` / `Ctrl K` 打开，键盘上下选择、回车打开
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
- Docker 24+（可选，用于容器部署）

## 快速开始

```bash
pnpm install      # 安装依赖（会自动执行 nuxt prepare）
pnpm dev          # 本地开发 http://localhost:3000
```

常用命令：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发，支持热更新 |
| `pnpm build` | 生产构建，预渲染全部页面到 `.output/` |
| `pnpm preview` | 运行构建产物 `node .output/server/index.mjs` |
| `pnpm lint` / `pnpm lint:fix` | ESLint 检查 / 自动修复 |
| `pnpm typecheck` | TypeScript 类型检查 |

## 目录结构

```text
.
├── app/
│   ├── assets/css/          # 全局样式与设计 token（main.css）、正文排版（prose.css）
│   ├── components/
│   │   ├── content/         # Markdown 渲染覆盖：ProsePre（代码块）、ProseImg、ProseTable、ProseA、ProseLi
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
│   ├── api/search.json.get.ts
│   ├── routes/              # rss.xml、sitemap.xml、robots.txt
│   └── utils/posts.ts
├── shared/                  # 前后端共用的工具函数与类型（slug、日期、分类聚合、阅读时间）
├── public/                  # favicon、默认 OG 图片、文章图片
├── deploy/nginx/            # Nginx 配置
├── content.config.ts        # 内容集合与 Front Matter schema
├── nuxt.config.ts
├── Dockerfile
└── docker-compose.yml
```

## 站点配置

站点名称、简介、域名、作者、GitHub、邮箱、社交链接、导航、分类描述等统一在 [`config/site.ts`](config/site.ts) 中维护。组件、SEO、RSS、Sitemap 均从这里读取。

GitHub 与邮箱目前是占位值，上线前请替换。

## 新增文章

在 `content/posts/` 下任意子目录（按主题分组，例如 `java/`、`ai/`）新建 `.md` 文件。**文件路径即 URL**：

```text
content/posts/java/java-21-features.md  →  /posts/java/java-21-features
```

Front Matter：

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

- 正文从 `##` 开始，页面标题由 `title` 渲染为 `<h1>`；目录（TOC）包含 `##` 与 `###`
- 分类与标签的 URL 由名称自动生成：`Big Data` → `/categories/big-data`，`Spring Boot` → `/tags/spring-boot`
- 新分类可在 `config/site.ts` 的 `categoryDescriptions` 中补充描述
- 图片放在 `public/images/posts/`，建议声明尺寸以避免布局偏移：

  ```markdown
  ![架构图](/images/posts/arch.png){width="1200" height="600"}
  ```

- 代码块请标注语言（`java`、`sql`、`bash`、`yaml`、`json`、`ts`、`vue`、`python`、`dockerfile` 等）。如需新增语言，在 `nuxt.config.ts` 的 `content.build.markdown.highlight.langs` 中添加

修改 `nuxt.config.ts` 中的 Markdown 配置（如高亮主题、TOC 深度）后，需要删除内容缓存再构建：`rm -rf .data && pnpm build`。

## 构建

```bash
pnpm build
pnpm preview   # 默认 http://localhost:3000，可通过 PORT / HOST 修改
```

构建时会预渲染所有页面、RSS、Sitemap 与搜索索引。站点域名在构建时写入页面，如需修改：

```bash
NUXT_PUBLIC_SITE_URL=https://blog.example.com pnpm build
```

## Docker 运行

```bash
cp .env.example .env     # 按需修改
docker compose up -d --build
```

- 访问 `http://127.0.0.1:3000`（compose 只绑定回环地址，由 Nginx 对外暴露）
- 镜像为多阶段构建，运行镜像只包含 `.output`，约 180 MB，以非 root 用户运行并内置健康检查
- 国内服务器构建较慢时可指定镜像源：`NPM_REGISTRY=https://registry.npmmirror.com/ docker compose build`
- 更新文章后重新执行 `docker compose up -d --build` 即可

常用运维命令：

```bash
docker compose ps
docker compose logs -f --tail 100
docker compose down
```

## 生产部署

推荐结构：`用户 → Nginx(443) → 127.0.0.1:3000 (Docker 容器)`。

1. 服务器安装 Docker 与 Nginx，拉取代码
2. 执行 `docker compose up -d --build`
3. 配置 Nginx 与 HTTPS 证书（见下文）
4. 在搜索引擎站长平台提交 `https://blog.wanghuanlab.com/sitemap.xml`

不使用 Docker 时：服务器上执行 `pnpm install && pnpm build`，用 systemd 或 pm2 运行 `node .output/server/index.mjs`（`HOST=127.0.0.1 PORT=3000`）。部署时只需要 `.output` 目录。

## Nginx 部署

配置文件：[`deploy/nginx/blog.wanghuanlab.com.conf`](deploy/nginx/blog.wanghuanlab.com.conf)，包含：

- HTTP → HTTPS 301 跳转（保留 `/.well-known/acme-challenge/` 用于证书签发）
- HTTPS / HTTP2，证书路径预留为 Let's Encrypt 默认位置
- gzip、HSTS 等安全响应头
- 缓存策略：`/_nuxt/` 一年 immutable，图片 7 天，RSS / Sitemap 1 小时，HTML 每次校验
- 结尾斜杠统一 301 到无斜杠地址，避免重复 URL
- 反向代理头：`Host`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`、`X-Forwarded-Host`

```bash
sudo cp deploy/nginx/blog.wanghuanlab.com.conf /etc/nginx/conf.d/
# 首次签发证书（证书签发前可先注释 443 server 块）
sudo certbot certonly --webroot -w /var/www/certbot -d blog.wanghuanlab.com
sudo nginx -t && sudo systemctl reload nginx
```

## 正式域名配置

1. DNS：为 `blog.wanghuanlab.com` 添加指向服务器公网 IP 的 A（或 AAAA）记录
2. 站点地址：默认已在 `config/site.ts` 中设为 `https://blog.wanghuanlab.com`；如需更换，修改该文件，或在构建时设置 `NUXT_PUBLIC_SITE_URL`
3. Nginx：修改配置中的 `server_name` 与证书路径
4. 重新构建：`docker compose up -d --build`

canonical、Open Graph、RSS、Sitemap、robots.txt 中的绝对地址都基于这一个配置生成。

## 后续扩展：Spring Boot + PostgreSQL CMS

当前版本不包含后端与数据库。数据访问集中在少数位置，便于未来替换数据源：

- 页面数据：`app/composables/usePosts.ts`（文章摘要）与 `app/pages/posts/[...slug].vue`（文章详情）
- 服务端数据：`server/utils/posts.ts`（RSS、Sitemap、搜索索引）

接入 CMS API 时，可将上述查询替换为 `$fetch` 调用后端接口，返回结构保持 `PostSummary` 一致即可，页面与组件无需改动。

## 已知限制

- 文章列表暂未分页，文章数量较多时再按需增加
- 搜索为客户端关键词匹配（多关键词 AND），不支持分词与拼写纠错；索引中每篇正文截取前 8000 字
- 阅读时间为估算值（中文约 400 字/分钟，英文约 220 词/分钟）
