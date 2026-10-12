---
title: "Spring Boot 微服务中的 Nacos 服务发现"
description: "从注册、发现到健康检查，梳理 Spring Boot 接入 Nacos 服务发现的关键配置，并与 Consul、Kubernetes Service 做选型对比。"
date: "2026-10-12"
updated: "2026-10-12"
category: "Spring"
tags:
  - Spring Boot
  - Spring Cloud
  - Nacos
  - Microservices
draft: false
---

服务发现解决的是"调用方如何找到可用的服务实例"。本文以 Spring Cloud Alibaba + Nacos 为例，梳理接入步骤与生产环境中需要注意的配置。

## 为什么需要服务发现

在容器化部署下，实例 IP 会随扩缩容和发布不断变化。硬编码地址或手工维护负载均衡列表都无法满足要求，因此需要：

1. **注册**：实例启动后把自己的地址、端口、元数据登记到注册中心
2. **发现**：调用方按服务名查询健康实例列表
3. **健康检查**：注册中心及时摘除不可用实例

![服务注册与发现示意图](/images/posts/placeholder-architecture.svg){width="1200" height="560"}

## 方案对比

| 维度 | Nacos | Consul | Kubernetes Service |
| --- | --- | --- | --- |
| 一致性模型 | AP（临时实例）/ CP（持久实例） | CP（Raft） | 依赖 etcd |
| 配置中心 | 内置 | KV 存储 | ConfigMap |
| Java 生态 | Spring Cloud Alibaba | Spring Cloud Consul | Spring Cloud Kubernetes |
| 适用场景 | 虚拟机 + 容器混合部署 | 多语言、多数据中心 | 纯 K8s 环境 |

> 如果所有服务都运行在 Kubernetes 中，直接使用 K8s Service + DNS 往往是最简单的选择；只有在存在大量 K8s 之外的实例时，独立注册中心的价值才更明显。

## 接入步骤

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

### 2. 配置注册中心

```yaml
spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_ADDR:127.0.0.1:8848}
        namespace: ${NACOS_NAMESPACE:dev}
        group: DEFAULT_GROUP
        metadata:
          version: v1
          zone: cn-shanghai-a
```

### 3. 通过服务名调用

```java
@Configuration
public class HttpClientConfig {

    @Bean
    @LoadBalanced
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}

@Service
@RequiredArgsConstructor
public class InventoryClient {

    private final RestClient.Builder builder;

    public StockDTO getStock(String sku) {
        return builder.baseUrl("http://inventory-service").build()
            .get()
            .uri("/api/stocks/{sku}", sku)
            .retrieve()
            .body(StockDTO.class);
    }
}
```

## 生产环境建议

- 使用 `namespace` 隔离环境，使用 `group` 隔离业务域
- 优雅下线：先从注册中心摘除，再停止进程，避免请求打到正在关闭的实例
- 客户端缓存：开启本地缓存，注册中心短暂不可用时仍可调用
- 为 Nacos 集群配置独立的 MySQL / PostgreSQL 持久化存储并做好备份

### 优雅下线示例

```bash
# 先下线实例，等待调用方缓存刷新后再停止服务
curl -X PUT "http://nacos:8848/nacos/v1/ns/instance?serviceName=order-service&ip=10.0.0.12&port=8080&enabled=false"
sleep 15
kill -TERM "$(cat /var/run/order-service.pid)"
```

## 小结

服务发现的选型应先看部署形态，再看团队维护能力。Nacos 的优势在于注册与配置一体化、对 Java 生态友好；而在纯 Kubernetes 环境中，原生 Service 往往能以更少的组件完成同样的工作。
