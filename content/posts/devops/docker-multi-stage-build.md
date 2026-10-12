---
title: "使用 Docker 多阶段构建优化镜像"
description: "通过多阶段构建、合理的层缓存与非 root 用户运行，构建体积更小、更安全的生产镜像。"
date: "2025-12-15"
category: "DevOps"
tags:
  - Docker
  - Spring Boot
  - CI/CD
draft: false
---

多阶段构建（Multi-stage Build）把"编译环境"和"运行环境"拆开，最终镜像只包含运行所需的文件。

## 效果对比

| 方案 | 镜像大小 | 包含构建工具 | 攻击面 |
| --- | --- | --- | --- |
| 单阶段（JDK + Maven） | ~ 800 MB | 是 | 大 |
| 多阶段（JRE） | ~ 220 MB | 否 | 中 |
| 多阶段 + 分层 Jar | ~ 220 MB | 否 | 中，且重新构建更快 |

## Spring Boot 示例

```dockerfile
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q package -DskipTests \
 && java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 app
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
```

## 层缓存原则

> 变化频率低的内容放在前面，变化频率高的内容放在后面。

1. 先复制依赖描述文件（`pom.xml`、`package.json`、`pnpm-lock.yaml`）
2. 安装依赖
3. 再复制源代码并构建

配合 `.dockerignore` 排除无关文件：

```bash
cat > .dockerignore <<'EOF'
.git
node_modules
target
*.log
EOF
```

## 安全建议

- 使用非 root 用户运行
- 固定基础镜像版本，定期更新补丁
- 不要把密钥写进镜像，通过环境变量或 Secret 注入
- 使用 `docker scout` 或 `trivy` 扫描漏洞

```bash
trivy image --severity HIGH,CRITICAL registry.example.com/order-service:1.4.0
```
