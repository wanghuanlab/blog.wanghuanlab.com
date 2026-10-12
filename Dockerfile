# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# ---- base：安装固定版本的 pnpm ----
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION=11.7.0
ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV npm_config_registry=${NPM_REGISTRY} \
    NUXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@${PNPM_VERSION} && pnpm --version
WORKDIR /app

# ---- deps：仅依赖清单变化时才重新安装 ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# postinstall（nuxt prepare）依赖源码，此处跳过，由构建阶段的 nuxt build 完成
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store

# ---- build：构建并预渲染全部页面 ----
FROM deps AS build
ARG NUXT_PUBLIC_SITE_URL=https://blog.wanghuanlab.com
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}
COPY . .
RUN pnpm build

# ---- runtime：只包含构建产物 ----
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=build --chown=node:node /app/.output ./.output
# Nuxt Content 运行时会在 .data 下初始化 SQLite 数据库，需要可写
RUN mkdir -p .data && chown node:node .data

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/robots.txt" || exit 1

CMD ["node", ".output/server/index.mjs"]
