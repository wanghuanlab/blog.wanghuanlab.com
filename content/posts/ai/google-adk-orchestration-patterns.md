---
title: "深入解析 Google ADK 核心编排模式：Sequential、Parallel、Loop 与多智能体架构演进实践"
description: "从单智能体概率推理走向企业级确定性编排：深度拆解 Google Agent Development Kit (ADK) 的两大概念体系（Workflow Agent 与 Multi-Agent Pattern）、三大内置确定性原语（SequentialAgent、ParallelAgent、LoopAgent）、高级协作模式（Supervisor、Handoff、Hierarchical）、subAgents 与 AgentTool 的控制权机理差异，以及 Java 企业级落地与 ADK 2.0+ Graph Workflow 演进全景。"
date: "2026-10-23"
updated: "2026-10-23"
category: "AI"
tags:
  - Google ADK
  - Multi-Agent
  - LLM
  - 架构设计
  - Sequential
  - Parallel
  - Loop
  - 工作流引擎
  - Java
draft: false
---

大语言模型（LLM）的单点推理能力正在逼近通用认知的上限，但在真实企业级复杂业务场景中，**单智能体（Single Agent）的脆弱性暴露无遗**：上下文膨胀引发注意力退化、多步推理中的意图漂移、非确定性导致的死循环，以及外部工具链调用的脆弱容错。

解决这一工程困境的核心思想，在于**将不确定性的大模型推理约束在确定性的工程拓扑之中**。

在 Google 推出的智能体开发套件 **Google ADK（Agent Development Kit）** 中，提供了远超简单“顺序流水”的丰富编排能力。它不仅内置了基础工作流，还全面支持动态调度、智能路由、层级分解与审查反馈。

本文结合交互式架构图、底层状态机机制、Java 与 Python 双语实现，对 Google ADK 支持的全部编排模式及其演进路径进行全景剖析。

---

## 一、核心认知对齐：Workflow Agent 与 Multi-Agent Pattern 的本质区别

在深入研究 Google ADK 之前，必须首先建立对**两层核心概念**的清晰认知。这是业界在多智能体系统设计中最容易混淆、但又是最核心的分水岭：

::archify-diagram{src="/diagrams/adk-pattern-vs-workflow.html" title="Google ADK 概念分层架构体系 (Pattern vs Workflow)" height="500"}
::

1. **Workflow Agent（内置工作流类型）**：
   * **定位**：框架提供的**具体类实现**（如 `SequentialAgent`、`ParallelAgent`、`LoopAgent`）。
   * **特征**：依靠纯代码确定性逻辑运行，**不依赖大语言模型**来决定“下一步该谁执行”，专门用于控制 Agent 之间确定性的执行顺序、并发扇出与循环边界。
2. **Multi-Agent Pattern（多智能体协作模式）**：
   * **定位**：上层的**系统架构设计模式**（如 `Supervisor`、`Hierarchical`、`Generator-Reviewer`）。
   * **特征**：**不是 ADK 提供的同名内置类**，而是架构师通过自由组合 `LlmAgent`、`WorkflowAgent`、`AgentTool` 与控制权转移机制（`transferToAgent`），搭配特定 Prompt 与业务门禁装配出来的协作体系。

---

## 二、Google ADK 支持的主要模式全景矩阵

根据 Google ADK 官方技术文档与生态演进，ADK 支持的核心模式与能力矩阵整理如下：

| 模式类别 | 核心能力 | 推荐实现方式 | Java SDK 支持 | 架构定位与设计要点 |
| :--- | :--- | :--- | :---: | :--- |
| **Sequential** | 严格顺序线性流水 | `SequentialAgent` | **支持** | **内置类**。前序产物通过 `output_key` 接力传递给后续步骤。 |
| **Parallel** | 多任务异步并发执行 | `ParallelAgent` | **支持** | **内置类**。Fork-Join 拓扑，无依赖子任务并行，压缩端到端耗时。 |
| **Loop** | 反馈迭代与自愈修复 | `LoopAgent` | **支持** | **内置类**。必须配置 `max_iterations` 保底与动态破环退出门禁。 |
| **Coordinator / Dispatcher** | 意图识别、智能任务分发 | `LlmAgent + subAgents` | **支持** | **设计模式**。主 Agent 判断意图后将请求路由至对应的专业专家。 |
| **Supervisor** | 主控统一规划与结果回收 | `LlmAgent + AgentTool` | **支持** | **设计模式**。**主控始终保有控制权**，将子 Agent 作为工具调用。 |
| **Handoff** | 控制权彻底交接转移 | `transferToAgent` / `auto_transfer` | **支持** | **设计模式**。类似客服分流转接，原 Agent 退出，目标 Agent 接管会话。 |
| **Hierarchical** | 复杂大任务层级树状分解 | 嵌套 Agent 结构 | **支持** | **设计模式**。大主管调度部门经理，部门经理调度一线专员。 |
| **Generator–Reviewer** | 生成初稿、对照审查、修改 | `Sequential + Loop` | **支持** | **设计模式**。生成者出方案，审查者打分，不合格打回重修。 |
| **Iterative Refinement** | 多轮循环自愈与打磨 | `Loop + escalate 门禁` | **支持** | **设计模式**。通过工具设置 `actions.escalate=true` 优雅跳出。 |
| **Human-in-the-loop** | 高危操作拦截与人工审批 | `Tool Confirmation` / 流程挂起 | **支持**（视版本） | **治理机制**。高敏感工具执行前阻塞挂起，等待人工签批通过。 |
| **Custom Workflow** | 针对特化业务的自定义控制 | 继承扩展 `BaseAgent` | **支持** | **扩展机制**。自行实现超时熔断、动态重试或局部补偿逻辑。 |
| **Graph Workflow** | 任意图结构、条件路由、状态机 | `Workflow Graph API` | **需持续关注** | **演进范式**。ADK 2.0 在 Python/Go 率先引入，Java 建议配合 Temporal。 |

---

## 三、Google ADK 架构底座与运行时机制

::archify-diagram{src="/diagrams/google-adk-architecture-patterns.html" title="Google ADK 核心架构与多模式编排运行时" height="560"}
::

如上图所示，Google ADK 的系统架构由三个核心平面协同构成：

1. **上下文与状态总线（Context Plane）**：
   * **`InvocationContext`**：贯穿单次任务生命周期的调用上下文，封装了请求元数据、鉴权凭据与环境配置。
   * **`Session State`**：跨智能体共享的状态载体。ADK 采用 `output_key` 机制，任何子智能体的结构化输出均可声明式注入 Session State，后续智能体通过参数模板直接按键消费，彻底杜绝隐式上下文丢失。
2. **确定性工作流原语层（Workflow Orchestration Primitives）**：
   * **`SequentialAgent`**：线性接力管道，确保任务步骤严格按序单向推进。
   * **`ParallelAgent`**：并发扇出（Fan-out）与汇聚（Gather），最大化压缩长链路墙钟时间。
   * **`LoopAgent`**：反馈修正环，通过循环试错驱动方案逼近验收标准。
   * **`ADK 2.0+ Workflow Graph`**：将确定性原语进一步升维为一等公民的 DAG/状态图引擎，支持复杂的动态条件分支与断点暂停。
3. **执行与门禁控制层（Execution & Tool Plane）**：
   * **专业 `LlmAgent`**：各司其职的角色智能体（如调研员、编码员、质检员），负责局部的非确定性认知推理。
   * **`ToolContext` & 退出门禁**：通过标准化的 `ToolContext.actions.escalate` 机制，赋予专业子智能体向上游工作流抛出中断、跳出循环或移交控制权的能力。
   * **MCP 与外部生态**：基于 Model Context Protocol（MCP）接入外部数据库、分析工具与微服务，保证工具接口的标准化。

---

## 四、三大内置工作流原语深度剖析

::archify-diagram{src="/diagrams/adk-three-primitives-comparison.html" title="Google ADK 三大确定性工作流原语运行拓扑对比" height="460"}
::

### 4.1 SequentialAgent（顺序流水线）

`SequentialAgent` 接收一个包含多个子智能体的有序列表，在被触发时，按照数组下标严格从前向后依序调度。

* **确定性推进行为**：除非子智能体显式抛出未捕获异常或请求人工中断，否则控制权永远只能单向向前流转，绝不会发生逆流或跳步。
* **数据接力机制**：每个子智能体配置 `output_key`（如 `output_key="extracted_data"`），执行完毕后该 key 对应的值自动持久化至共享 Session State。后续智能体可以在其 Prompt 模板或工具参数中直接通过 `{extracted_data}` 引用。

```python
from google.adk.agents import SequentialAgent, LlmAgent

# 1. 静态代码分析
code_analyzer = LlmAgent(
    name="CodeAnalyzer",
    model="gemini-2.5-flash",
    instruction="阅读源码，提取潜在缺陷、复杂度热点和安全漏洞，输出结构化报告。",
    output_key="analysis_report"
)

# 2. 修复建议生成（消费前一步骤的产物）
code_refactorer = LlmAgent(
    name="CodeRefactorer",
    model="gemini-2.5-flash",
    instruction="根据分析报告 {analysis_report}，给出具体重构建议与修复后的代码。",
    output_key="refactored_code"
)

# 3. 组装为顺序流水线
code_pipeline = SequentialAgent(
    name="CodePipeline",
    sub_agents=[code_analyzer, code_refactorer]
)
```

### 4.2 ParallelAgent（并发扇出与收集）

当一个综合任务可以被拆解为多个**互不依赖、可独立推进的子维度**时，串行处理会造成巨大的时间浪费。`ParallelAgent` 实现了经典的 **Fan-Out / Gather（扇出与收集）** 拓扑：

* **并行触发（Fork）**：`ParallelAgent` 在同一时间将共享上下文广播分发给所有配置的子智能体，各智能体异步并发执行。
* **屏障同步（Join）**：主线程在 Join 屏障处挂起等待，直到所有并发子智能体均完成执行（或达到超时阈值）后，统一收集所有产物并写入 Session State。
* **延迟优化**：端到端墙钟耗时从串行累加的 `O(Σ T_i)` 骤降至最慢单步决定的 `O(max(T_i) + δ)`。

```python
from google.adk.agents import ParallelAgent, LlmAgent

perf_expert = LlmAgent(name="PerfAuditor", model="gemini-2.5-flash", instruction="评估吞吐量与瓶颈", output_key="perf_res")
sec_expert = LlmAgent(name="SecAuditor", model="gemini-2.5-flash", instruction="评估合规与安全漏洞", output_key="sec_res")

parallel_auditors = ParallelAgent(
    name="ParallelAuditCluster",
    sub_agents=[perf_expert, sec_expert]
)
```

### 4.3 LoopAgent（循环迭代与自愈）

在复杂生成式任务中，初稿往往无法一次性满足高标准的业务规则。**`LoopAgent` 构建了“生成者-审核者（Generator-Critic）”的自愈迭代环**。

若缺乏工程约束，循环流极易沦为灾难性的“死循环”或“Token 燃烧器”。Google ADK 通过**两道严密的防线**实现确定性闭环控制：

1. **确定性硬上限（`max_iterations`）**：
   系统级别配置最大的完整循环次数（如 `max_iterations=3`）。一旦循环轮次耗尽，无论当前质量如何，强制终止循环并向下游抛出超时或标记。
2. **动态破环门禁（`actions.escalate`）**：
   `LoopAgent` 自身没有大模型思维能力，因此它依赖其下属的质检智能体在判断任务达标后，调用特定的“退出工具”。在工具函数内部设置 `tool_context.actions.escalate = True`，通知外层框架立即优雅中断当前循环。

```python
from google.adk.agents import LoopAgent, LlmAgent
from google.adk.tools import FunctionTool
from google.adk.tools.tool_context import ToolContext

# 动态破环退出工具
def complete_review(score: int, comment: str, tool_context: ToolContext):
    """当方案质量达到 85 分以上时，调用此函数跳出循环。"""
    if score >= 85:
        tool_context.actions.escalate = True
        return {"status": "SUCCESS", "message": f"质检通过（得分: {score}），退出循环。"}
    return {"status": "REJECTED", "message": f"质检未通过（得分: {score}，原因: {comment}），触发重新修改。"}

review_tool = FunctionTool(func=complete_review)
```

---

## 五、企业级 Supervisor 模式全景深度剖析：架构、协议与支撑生态

在多智能体系统（Multi-Agent System）架构中，**Supervisor（主管/监督者）模式是连接“概率性认知推理”与“工业级确定性工程”最关键的中枢架构**。

与传统的流水线不同，企业级真实场景充满了不确定性：用户需求模糊、外部 API 瞬时异常、子任务执行失败需重规划、以及高危操作必须等待人工确认。Supervisor 模式正是为了化解这一系列高熵挑战而生。

---

### 5.1 Supervisor 模式的核心定位与运作哲学

Supervisor 模式并非单一的算法，而是一套**分工高度解耦的指挥官架构哲学**。其核心特征在于：

1. **认知关注点分离（Separation of Cognitive Concerns）**：
   * **Supervisor（主 Agent）**：不做具体的编码、分析或数据抓取，专职负责**意图拆解、任务分发、进度跟踪、质量验收与最终合成**。
   * **Sub-Agents（专业子 Agent）**：不关心全局大盘和最终用户是谁，专职在各自的垂直领域（如架构规划、代码研发、安全合规扫描）深耕，提供高质量的局部认知推理。
2. **上下文沙箱隔离（Context Sandbox Isolation）**：
   主控并不需要将上百轮工具调用的细枝末节塞入自己的上下文。每个子 Agent 在独立的沙箱上下文中运行，只将提炼后的确定性成果回传给 Supervisor，从物理上杜绝了主模型的**注意力退化与上下文膨胀**。
3. **控制权永不脱缰（Invariable Control Sovereignty）**：
   无论调度何种专员智能体，整个会话的最终决策权、推进节奏与交付状态始终稳稳锁定在 Supervisor 手中。

---

### 5.2 整体技术架构全景图

下图完整展示了企业级 Supervisor 智能体系统的技术架构，重点展现了**“主控专注全局调度管控、业务 MCP 权责下沉专员、本地 AgentTool 与分布式 A2A 双模通信”**的工程规范：

::archify-diagram{src="/diagrams/adk-supervisor-architecture-deep-dive.html" title="Google ADK 企业级 Supervisor 模式技术架构全景图" height="600"}
::

在这套架构中，系统自顶向下由五大核心平面组成：

1. **接入网关层（Client & Ingress Gateway）**：接收用户 Prompt 或企业触发事件，初始化全局调用上下文 `InvocationContext`，支持 REST、WebSocket 与 SSE 双向流式交互。
2. **主控中枢层（Supervisor Controller Core）**：系统的中央大脑，专职负责意图解析、动态任务拆解（ReAct Planner）、多源冲突裁决与全局控制权锁定。**主控严禁直接挂载底层业务读写工具**。
3. **智能体调度与协作总线（Dispatch & Collaboration Highway）**：
   * **本地/单进程形态**：通过 Google ADK 原生 **`AgentTool`** 高阶沙箱进行内存级直接调用，零网络损耗，控制权永不脱缰。
   * **分布式/跨服务形态**：通过 **`A2A（Agent-to-Agent）`** 协议总线进行跨进程、跨容器的异步契约通信（基于 gRPC / JSON-RPC / Task Envelope）。
4. **专业子智能体与业务 MCP 工具下沉层（Specialized Units & Domain MCPs）**：
   * **专员集群**：Planner（架构方案）、Executor（研发代码）、Reviewer（质检把关）、Analyst（数据洞察）。
   * **业务 MCP 下沉**：每个子智能体**专属性挂载**自己领域的 MCP Server（如研发专员独占 Git/CI MCP，分析专员独占 Database MCP），主控绝不越权兼任。
5. **企业级支撑服务底座（Enterprise Supporting Infrastructure）**：记忆中心、注册发现、Temporal 状态持久化、OTel 可观测与安全围栏、HITL 人工通道五大支柱共同托底系统高可用。

---

### 5.2.1 架构深度辨析：主控该不该挂载业务 MCP？主子通信机制究竟为何？

在构建复杂多智能体系统时，许多工程师容易在通信边界和工具划分上陷入误区。理解以下两大设计决策，是系统从“实验性玩具”走向“工业级生产”的关键分水岭：

#### 辨析一：主 Agent 直接通过 A2A 和子 Agent 交互吗？

**结论**：在物理架构上，主 Agent 与子 Agent 的交互存在**本地进程内**与**分布式跨网络**两层形态，切忌一刀切：

1. **单体/单进程运行（In-Process MAS）**：
   * **交互方式**：直接使用 Google ADK 的 **`AgentTool`**。
   * **运行原理**：主 Agent 将子 Agent 包装为一个内存中的本地可调用函数（Tool）。主控以参数形式传入任务，子 Agent 在局部沙箱线程/协程中执行完毕，返回结构化 JSON 或结果摘要。
   * **优势**：**零网络开销、微秒级延迟、强类型对象直接传递**。在单体应用或开发调试期，绝无需徒增一套 RPC 网络通信中间件。
2. **分布式/微服务协同（Distributed MAS）**：
   * **交互方式**：采用标准的 **A2A（Agent-to-Agent）协议**。
   * **适用场景**：当专员智能体需要独立弹性伸缩（如 Python 算法 Agent、C++ 高频风控 Agent、Java 核心业务 Agent 运行在不同的 K8s Pod 甚至跨机房跨组织时）。
   * **运行原理**：基于标准化 Task Envelope（包含 TraceID、AuthToken、Deadline），通过 gRPC、JSON-RPC 或 SSE 实现长连接调用、中间思考过程流式推送与异步事件通知。

#### 辨析二：主 Agent 该不该直接通过 MCP 调用业务服务？

**结论**：**坚决反对主 Agent 直接挂载具体的业务 MCP 工具！业务 MCP 必须严格下沉给对应的专业子 Agent。**

许多初学者常犯的错误，是把数据库写入、Git 提交、第三方支付 API 等所有 MCP 工具统统挂载到 Supervisor 上。这种“全能大包大揽”的主控会带来四大灾难：

1. **Prompt 污染与注意力稀释（Attention Dilution）**：
   大模型的 Context Window 空间与注意力分布是极其宝贵的资源。每一个 MCP 工具都会注入详尽的描述词（Description）与复杂的参数 JSON Schema。如果主控挂载了数十个具体业务工具，主模型的上下文会被海量底层细节填满，**直接削弱其对顶层目标分解、逻辑编排与质量判断的核心注意力**。
2. **违背最小权限原则（Principle of Least Privilege, PoLP）与防越狱**：
   Supervisor 是直接面向终端用户的交互入口。若 Supervisor 身兼写库、删表、转账等高危 MCP 工具，一旦遭遇恶意用户的 **Prompt Injection（提示词注入攻击）**，攻击者便可直接操控主控执行越权破坏。将高危工具隔离在后方子 Agent 的沙箱内，能天然形成纵深防御体系。
3. **职责内聚与指挥官定位（Separation of Concerns）**：
   在组织架构中，CEO（Supervisor）负责制定战略与考核产出，绝不应该亲自下场写 SQL 或跑编译命令。专业的事交给专员做：
   * **Executor Agent** 手持 **Git / CI MCP**；
   * **Analyst Agent** 手持 **Database / Data Lake MCP**；
   * **Reviewer Agent** 手持 **SonarQube / Security Scanner MCP**；
   * **Supervisor Agent** 只持 **“智能体调度工具”** 与 **“流程管控工具”**。

#### 企业级工具分级归属管理矩阵

| 工具分类 | 工具归属组件 | 典型工具形态 | 权限级别 | 核心职责 |
| :--- | :--- | :--- | :---: | :--- |
| **协同调度工具** | **Supervisor（主控独占）** | `AgentTool` (Planner/Executor/Reviewer)、A2A Client | 高（管控级） | 派发子任务、收集专员结论、推进业务 DAG 拓扑 |
| **流程治理工具** | **Supervisor（主控独占）** | HITL 审批挂起 (`actions.escalate`)、Temporal 状态打点 | 高（管控级） | 高危节点阻断待批、长流程持久化快照 |
| **研发执行 MCP** | **Executor Sub-Agent** | Git Branch/Commit、CI Pipeline Trigger、容器执行 | 中/高（领域级） | 专注代码生成、编译运行与研发交付 |
| **数据分析 MCP** | **Analyst Sub-Agent** | PostgreSQL 只读查询、Google Search API、数据清洗 | 中（只读/受控） | 专注异构数据抓取、日志聚合与统计度量 |
| **质量审查 MCP** | **Reviewer Sub-Agent** | SonarQube 代码扫描、CVE 依赖审计、单测报告生成 | 低/只读（检测级） | 专注安全漏洞筛查与代码规范打分 |

---

---

### 5.3 主智能体（Supervisor Core）：控制权不灭与动态自愈机理

在 Google ADK 中实现 Supervisor 模式，架构师最容易掉入的陷阱就是混淆了 **`subAgents`** 与 **`AgentTool`** 的本质语义差异：

#### 1. 致命误区：误用 `subAgents` 导致控制权流失

```java
// 典型误区示例：错误地使用 subAgents 构造 Supervisor
LlmAgent planner = LlmAgent.builder().name("Planner").description("负责任务拆解").model(model).build();
LlmAgent executor = LlmAgent.builder().name("Executor").description("负责执行任务").model(model).build();

LlmAgent supervisor = LlmAgent.builder()
    .name("Supervisor")
    .model(model)
    .instruction("根据用户目标决定调用哪个专业智能体，全部完成后返回结果。")
    .subAgents(planner, executor) // 致命隐患：挂载为 subAgents！
    .build();
```

* **运行机理**：在 Google ADK 底层，`subAgents` 触发的是 **Handoff（控制权交接）** 协议。
* **致命隐患**：当 Supervisor 决定交接给 `Executor` 时，底层通过 `transferToAgent` 将**整场对话的发言权与主导权彻底转交给了 Executor**。此时 Executor 接管了与用户的上下文，它完成本职任务后，**并不会自动将控制权还给 Supervisor**！
* 除非在 Executor 内部再硬编码写指令让其把控制权转移回 Supervisor，否则系统极易发生“控制权流失”、“死在子节点”或无法在主节点统一总结的现象。

#### 2. 推荐正解：使用 `AgentTool` 实现真正的控制权常驻

如果希望 Supervisor **始终稳坐指挥席**，在调用完专员后立刻拿回结果、统一归纳并评估下一步，**必须使用 `AgentTool`（智能体工具化）**。将专业 Agent 封装为无状态/隔离调用的标准高阶工具，主控可以像调用普通计算器一样调用子智能体：

##### Java 生产实现

```java
package com.wanghuanlab.adk.supervisor;

import com.google.adk.agents.LlmAgent;
import com.google.adk.models.BaseModel;
import com.google.adk.tools.AgentTool;

public class EnterpriseSupervisorFactory {

    public static LlmAgent createSupervisor(BaseModel model) {
        // 1. 定义专业领域的业务 Agent（保持专注与高内聚）
        LlmAgent planner = LlmAgent.builder()
            .name("PlannerAgent")
            .description("资深架构规划师：负责根据业务需求拆解详细的技术实现步骤与依赖清单。")
            .model(model)
            .build();

        LlmAgent executor = LlmAgent.builder()
            .name("ExecutorAgent")
            .description("核心研发工程师：根据技术规范与步骤生成实际的代码或调用执行服务。")
            .model(model)
            .build();

        LlmAgent reviewer = LlmAgent.builder()
            .name("ReviewerAgent")
            .description("质量保证审查员：对执行产出的代码与方案进行合规性、单测覆盖率与性能安全核验。")
            .model(model)
            .build();

        // 2. 将专业 Agent 封装为无状态/沙箱调用的标准高阶工具 (AgentTool)
        // 关键所在：封装后，专业 Agent 在主控眼中就是一个单次输入、确定性返回结果的 Tool！
        AgentTool plannerTool = AgentTool.fromAgent(planner);
        AgentTool executorTool = AgentTool.fromAgent(executor);
        AgentTool reviewerTool = AgentTool.fromAgent(reviewer);

        // 3. 构建中心化主控智能体 (Supervisor)
        return LlmAgent.builder()
            .name("MasterSupervisor")
            .model(model)
            .instruction("""
                你是企业多智能体协同系统的总指挥 (Master Supervisor)。
                你的核心职责：
                1. 深度分析用户的复杂诉求，首先调用 PlannerAgent 生成分步执行计划；
                2. 针对拆解出的每一步骤，通过 ExecutorAgent 工具获取执行结果；
                3. 将产出交付给 ReviewerAgent 进行严格质量检查，若不合格要求重新执行；
                4. 你始终拥有唯一的全局会话控制权，汇总所有专员工具的产物，向用户输出最终答卷。
                """)
            .tools(plannerTool, executorTool, reviewerTool) // 挂载为工具，保证控制权永远在主控！
            .build();
    }
}
```

##### Python 生产实现

```python
from google.adk.agents import LlmAgent
from google.adk.tools import AgentTool

# 1. 声明专员智能体
planner_agent = LlmAgent(name="Planner", model="gemini-2.5-flash", instruction="输出技术方案与执行步骤")
coder_agent = LlmAgent(name="Coder", model="gemini-2.5-flash", instruction="根据方案编写高质量生产代码")
audit_agent = LlmAgent(name="Auditor", model="gemini-2.5-flash", instruction="对代码进行单测核验与漏洞扫描")

# 2. 转换为标准沙箱工具
planner_tool = AgentTool.from_agent(planner_agent)
coder_tool = AgentTool.from_agent(coder_agent)
audit_tool = AgentTool.from_agent(audit_agent)

# 3. 组装主控 Supervisor
supervisor = LlmAgent(
    name="EnterpriseSupervisor",
    model="gemini-2.5-flash",
    instruction="""
    你是企业级工程总指挥。
    - 严禁自己直接生成未经审核的代码；
    - 针对开发任务，依次调动 Planner -> Coder -> Auditor；
    - 若 Auditor 打分低于 90，提取修改意见后重新调度 Coder 工具修正；
    - 最终向用户输出完整的交付物与质检报告。
    """,
    tools=[planner_tool, coder_tool, audit_tool]
)
```

---

### 5.4 专业子智能体（Specialized Worker Sub-Agents）：高内聚领域沙箱

子智能体（Worker Sub-Agents）的设计必须恪守**单一职责原则（Single Responsibility Principle）**：

1. **严格限定职责边界**：
   * **Planner Agent**：只做全局方案与拓扑分解，不碰具体业务执行。
   * **Executor Agent**：专注于基于规范产出成果，不自行更改顶层计划。
   * **Reviewer Agent**：专门依据合规 Checklist、单测覆盖率、性能规范对产物进行客观打分，绝不充当“好好先生”。
   * **Data Analyst Agent**：专注于多维指标挖掘、日志聚类与数据统计。
2. **强类型 DTO 交互契约**：
   子智能体之间的产物交互，绝不能依靠漫无边际的非结构化长文本，而必须借助 **JSON Schema / Pydantic Model / Java Record** 规范出清晰的请求与响应契约（如 `ExecutionTaskRequest`、`ReviewReportResponse`）。
3. **上下文物理隔离**：
   子智能体每次被 `AgentTool` 唤起时，系统分配的是独立的局部执行上下文，子模型对外部微服务调用的十余轮往返记录，仅在局部沙箱中消耗，**最终只向 Supervisor 回送 1 条结构化的汇总事实**，从而极大延缓了主控 Context Window 的消耗速度。

---

### 5.5 协议与通信双翼：A2A 协同协议与 MCP 工具网关的融合

在现代企业架构中，系统通过 **A2A（智能体间软认知协同）** 与 **MCP（外部物理工具硬能力执行）** 构建了权责分明、上下贯通的垂直调用链：

```text
Supervisor（总控大脑 · 统筹规划与验收）
   │
   ├─► [本地单进程模式] ──> Google ADK AgentTool 沙箱高阶调用
   └─► [分布式微服务]  ──> A2A Protocol 协同通信总线 (Task Envelope / 事件回调)
          │
          ▼
   Sub-Agents（专业子智能体：Executor / Reviewer / Analyst ...）
          │
          └─► [MCP 统一工具协议] ──> 专员持有的业务 MCP Server
                 │
                 ├─► MCP Git / CI (研发专用)
                 ├─► MCP Database (数据分析专用)
                 └─► MCP Security Scanner (代码审计专用)
```

#### 1. A2A（Agent-to-Agent）协同协议：智能体间的“通用语言”

* **定位**：解决**智能体与智能体之间（Agent-to-Agent）**的高层认知级协作通信。
* **核心内容**：
  * **Task Envelope 结构封装**：包含任务 TraceID、父会话引用、安全鉴权凭据与执行超时 Deadline。
  * **认知流式反馈**：子 Agent 在长时间推理时，可通过 A2A 事件总线向上层 Supervisor 推送心跳与进度更新（如 `step: 3/5, progress: 60%`）。
  * **仲裁与中断协议**：当专员遇到不可解异常或死循环嫌疑时，通过 A2A 标准的 `EscalateAction` 向上层主控交出异常堆栈。

#### 2. MCP（Model Context Protocol）工具网关：智能体与现实系统的“插座”

* **定位**：解决**智能体与外部客观软件系统**之间的标准化互通，由 Anthropic 提出并迅速成为业界开放事实标准。
* **核心内容**：
  * **统一协议抽象**：将外部系统的能力归一化为三大类一等公民：**Tools（函数执行）**、**Resources（上下文数据源读取）** 与 **Prompts（提示词模版）**。
  * **语言无关与沙箱部署**：MCP Server 可以使用 Python、Go、Node.js 等任意语言编写，通过标准 Stdio 或 SSE（Server-Sent Events）与宿主专员连接。
  * **动态工具发现**：专员 Agent 启动时向 MCP Gateway 发送 `tools/list` 请求，动态感知最新的数据库只读接口或 Git 仓库操作工具，免去代码硬编码。

#### 3. 协同价值与边界归纳

* **A2A** 解决的是**“谁该指挥谁、谁该向谁汇报、状态如何同步”**的组织治理问题；
* **MCP** 解决的是**“专员如何操作现实世界的 Git、SQL、API 与知识库”**的工程落地问题；
* **关键准则**：**主控绝不越级去直接调用专员底下的业务 MCP 工具**，专员也绝不越权抢夺主控的全局 A2A 编排权。两者权责分离，共同铸就了企业级 Supervisor 模式的稳定性基石。

---

### 5.6 企业级支撑服务体系：打造工业级可靠底座

脱离了基础架构支撑的 Agent 系统只能是“玩具”。在企业级生产落地中，五大支撑服务为 Supervisor 模式筑牢了生命线：

#### 1. 记忆与上下文存储服务（Memory & Context Store）
* **分级存储架构**：
  * **L1 瞬时状态（RAM / Redis）**：持久化当前的 `InvocationContext` 与共享 `Session State`，支撑高频毫秒级读写。
  * **L2 长期记忆（Vector DB + RAG）**：沉淀历史业务决策案例、行业标准与领域知识，供 Supervisor 在规划阶段进行少样本检索增强（Few-Shot RAG）。
* **上下文压缩治理**：当任务轮次超过预警水位时，由背景 Worker 自动启动“对话摘要压缩算法”，保留关键决策元数据并释放原始 Token。

#### 2. 智能体与工具注册中心（Registry & Discovery）
* **动态服务发现**：专员 Agent 与 MCP Server 启动后自动向注册中心登记元数据（能力描述、参数 JSON Schema、版本号、所属部门）。
* **灰度路由与熔断**：主控根据版本权重（如 `PlannerAgent:v2.1` 灰度 20% 流量）进行平滑发布；当某专员持续超时或报错率超标时，注册中心自动切断流量并降级至兜底策略。

#### 3. 状态机与持久化编排引擎（Temporal Durable Execution）
* **长周期任务保活**：复杂企业研发或审批往往跨越数小时甚至数天，进程内内存极易因发布、OOM 或机器重启而丢失。
* **Temporal 融合实践**：Supervisor 的每一次重大任务派发均作为 Temporal Workflow 中的一个 Activity。一旦节点宕机，Temporal 借助底层 Event History 重放（Replay），能够**分毫不差地在另一台服务器上原地唤醒 Supervisor**，彻底杜绝丢单。

#### 4. 全链路可观测性与安全围栏（Observability & Guardrails）
* **OpenTelemetry 深度链路追踪**：为每一次根请求生成 `TraceID`，主控拆解、A2A 专员调用、MCP 工具执行均对应为子 `Span`，在 Jaeger / Datadog 上清晰绘制出“Agent 思考路径瀑布图”。
* **成本审计与限流**：实时统计每一轮调度消耗的 Prompt Tokens、Completion Tokens 与实际美元成本，设置租户级日配额硬上限。
* **AI 安全围栏（Guardrails）**：前置拦截 Prompt 注入（Jailbreak），后置过滤敏感信息泄漏（PII 遮蔽），确保企业数据不出红线。

#### 5. 人机协同介入通道（Human-in-the-Loop, HITL）
* **风险定级与审批门禁**：对只读类工具（检索、读代码）直接放行；对具有写操作或破坏性的工具（修改生产数据库、提交代码合并、向外部打款）实施**阻断挂起**。
* **状态机挂起与恢复**：系统自动生成工单推送到企微 / 钉钉 / Slack，由业务主管审批。主管点击“通过”后，系统注入审批 Token 唤醒挂起的 Supervisor 继续向下执行。

---

### 5.7 生产实战避坑指南

在落地 Supervisor 模式时，建议架构团队重点防范以下典型陷阱：

1. **防范 Supervisor 递归思考死锁（Thinking Deadlock）**：
   * **现象**：主控认为专员交付的内容“稍有不足”，反复打回重新调度，导致 Token 急剧消耗且迟迟无法响应用户。
   * **防御策略**：必须在 Supervisor 层设定**最大决策步数硬上限（Max Steps Limit，推荐 5-8 步）**。一旦超限，强制触发降级策略，将当前最优成果连同“质检风险警告”一并交付用户。
2. **警惕子 Agent 返回无界长文本**：
   * **防御策略**：在专员 AgentTool 上务必配置 `max_output_tokens` 与格式校验器，强制子智能体只输出结构化的最终 Summary，杜绝子智能体将万字调试日志倾倒给主控。
3. **避免主控越俎代庖（Prompt Drift）**：
   * **防御策略**：在 Supervisor 的 System Instruction 中必须严厉警告：*“你仅负责协调与汇总，绝不可自行替专员编写具体代码或替代专员作专业论断”*，并在输出层通过 Guardrail 进行角色合规校验。

---

---

## 六、模式融合实战：复合多智能体流水线全景

在真实生产系统落地时，业界普遍采用的黄金方案是**“以 Sequential 为骨干流水线，局部嵌套 Parallel 采集与 Loop 质检自愈”**的复合拓扑。

下图生动展示了一套典型的多智能体企业交付流水线全周期执行：

::archify-diagram{src="/diagrams/google-adk-workflow-lifecycle.html" title="Google ADK 复合工作流执行全景图" height="520"}
::

在这套端到端生命周期中：
1. **阶段一（摄入与并发采集）**：任务请求进入，创建持久化 `InvocationContext`；主流程通过 `SequentialAgent` 步骤 1 调起 `ParallelAgent`，触发多源并发调研。
2. **阶段二（方案汇聚与迭代打磨）**：主流程收集并行产物合成初稿，写入共享 `Session State`；随后移交给 `LoopAgent` 迭代环，执行 Generator ⇄ Critic 质检。
3. **阶段三（门禁放行与终态签发）**：Critic 审核达标后，触发 `actions.escalate` 破环门禁，平滑回到外层主流程完成签发交付，全链路 Trace 与指标持久化归档。

### 端到端完整生产拓扑代码

```python
from google.adk.agents import SequentialAgent, ParallelAgent, LoopAgent, LlmAgent
from google.adk.tools import FunctionTool
from google.adk.tools.tool_context import ToolContext

# 1. 工具与破环门禁
def approve_deliverable(score: int, tool_context: ToolContext):
    """质检通过触发退出工具"""
    if score >= 90:
        tool_context.actions.escalate = True
        return {"status": "APPROVED", "score": score}
    return {"status": "NEEDS_REVISION", "score": score}

approval_tool = FunctionTool(func=approve_deliverable)

# 2. 并发采集集群
market_analyst = LlmAgent(name="MarketAnalyst", model="gemini-2.5-flash", instruction="提取行业竞品情报与市场容量。", output_key="market_data")
tech_analyst = LlmAgent(name="TechAnalyst", model="gemini-2.5-flash", instruction="调研技术栈成熟度与开源协议许可证合规性。", output_key="tech_data")

parallel_research = ParallelAgent(
    name="ParallelResearchPool",
    sub_agents=[market_analyst, tech_analyst]
)

# 3. 汇总与初稿起草
proposal_synthesizer = LlmAgent(
    name="ProposalSynthesizer",
    model="gemini-2.5-flash",
    instruction="基于市场情报 {market_data} 与技术情报 {tech_data}，合成项目可行性初稿。",
    output_key="draft_proposal"
)

# 4. 循环打磨与合规质检
drafter = LlmAgent(
    name="RefiningDrafter",
    model="gemini-2.5-flash",
    instruction="根据修改意见 {critic_opinion} 优化项目可行性初稿 {draft_proposal}。",
    output_key="refined_proposal"
)

critic = LlmAgent(
    name="StrictCritic",
    model="gemini-2.5-flash",
    tools=[approval_tool],
    instruction="评估提案质量与合规性。达到 90 分调用 approve_deliverable 签发；否则输出意见至 critic_opinion。",
    output_key="critic_opinion"
)

refinement_loop = LoopAgent(
    name="QualityAssuranceLoop",
    sub_agents=[drafter, critic],
    max_iterations=3
)

# 5. 终态发布智能体
publisher = LlmAgent(
    name="PublishingAgent",
    model="gemini-2.5-flash",
    instruction="将终版方案 {refined_proposal} 生成正式的发布报告，生成执行计划。",
    output_key="final_deliverable"
)

# 6. 顶层流水线组装
enterprise_maop_pipeline = SequentialAgent(
    name="EnterpriseDeliveryPipeline",
    sub_agents=[
        parallel_research,     # 步骤 1: 并发扇出
        proposal_synthesizer,  # 步骤 2: 汇总初稿
        refinement_loop,       # 步骤 3: 循环质检自愈
        publisher              # 步骤 4: 成果归档签发
    ]
)
```

---

## 七、架构演进：从模版智能体走向 ADK 2.0+ Graph Workflow

随着业务拓扑复杂度从简单的几步流水线发展到数十个节点的复杂企业级流程，**嵌套模版类（Template Agents）的局限性逐渐显现**：

1. **嵌套层级过深**：当流程中出现复杂的“若 A 失败则并发 B 与 C，若 C 超过阈值则跳转回 A”时，树状嵌套代码的可读性急剧恶化。
2. **缺乏非线性动态跳转**：现实业务中存在大量“回跳任意前置节点”、“基于多条件权重的动态选路”，单靠树状原语需要编写大量冗余胶水逻辑。

因此，Google ADK 在 2.0+ 演进中正式推出了**图工作流引擎（Graph-Based Workflow Engine）**：

| 演进维度 | 传统模版智能体（ADK 1.x 原语） | 现代状态图工作流（ADK 2.0+ Workflow） |
| :--- | :--- | :--- |
| **拓扑表现力** | 树状层次结构（Sequential 套 Loop 套 Parallel） | 任意有向图（DAG / StateGraph），节点与边一等公民 |
| **路由决策** | 严格受限于容器定义，仅能向前或预定义内环 | 显式条件边（Conditional Edges），支持任意动态跳转 |
| **状态持久化** | 依赖进程级上下文传递，崩溃后难以从单点恢复 | 原生状态机持久化与检查点（Checkpointing），随时恢复 |
| **人工介入** | 需借助特殊工具调用中断，恢复逻辑复杂 | 原生挂起（Interrupt）与审批放行能力 |
| **学习曲线** | **极低**，几行代码即可直观组装 | 略高，需设计状态迁移模型与强类型契约 |

> **多语言现状提示**：
> ADK 2.0 的 Graph API 当前率先在 Python 与 Go 版本中落地。对于 Java 后端体系，短期内切忌盲目等待官方 Graph API，当前生产实践的最佳组合是：**在应用层使用 `Supervisor (AgentTool)` 配合确定性 `WorkflowAgent`，外层依托 Temporal 解决状态机持久化与断点自愈**。

---

## 八、核心模式选型矩阵与企业工程度量

在架构设计与业务落地时，可参考以下多维选型对照矩阵：

| 编排模式 | 核心控制机制 | 墙钟延迟表现 | Token 消耗模型 | 容错复杂度 | 黄金应用场景 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Sequential** | 严格串行单向推流 | 较高（单步累加 O(Σ T_i)） | 线性累加（需控上下文） | 简单（单点截断） | 标准 SOP、代码生成与测试、数据清洗流水线 |
| **Parallel** | 异步并发 Fork-Join | 极优（取决于最长单步 O(max(T_i) + δ)） | 瞬时并发激增（需控限流）| 中等（长尾木桶效应） | 多维度独立审计、多数据源检索、多方案头脑风暴 |
| **Loop** | 反馈循环 + Escalate 门禁 | 可变（取决于轮次 O(k · T_loop)） | 循环成倍消耗（严格上限） | 较高（需防模型振荡） | 代码编译自愈修复、合规打分修正、文本精细校对 |
| **Supervisor (AgentTool)** | 主控调度 + 工具级沙箱 | 视规划路径动态决定 | 主控持续消耗（需精简上下文）| 中等（单步隔离良好） | 综合业务管家、多角色跨领域专家协同总控 |
| **Graph Workflow** | 状态图驱动 + 条件边 | 视拓扑图路径而定 | 路径自适应消耗 | 高（依赖检查点底座） | 跨部门长周期业务流程、风控审批流、高可用系统 |

### 企业级项目落地建议拓扑

针对复杂的生产系统，推荐采用以下分层复合架构：

::archify-diagram{src="/diagrams/adk-enterprise-composite-architecture.html" title="企业级多智能体协同推荐架构 (Supervisor + Workflow + Temporal)" height="540"}
::

1. **Supervisor + AgentTool 坐镇总控**：主 Agent 负责智能感知与调度，把子 Agent 当作工具调用，控制权永不流失。
2. **ParallelAgent 负责并发加速**：独立无依赖的数据抓取、跨领域背景分析并发推进。
3. **SequentialAgent 固化业务铁律**：有明确前后置依赖的业务流水线（如开户审查、打款前置校验）采用确定性串联。
4. **LoopAgent 铸造质量防线**：结合定量打分规则与 `actions.escalate` 退出机制，未达标打回局部自愈。
5. **外层依托 Temporal 托底高可用**：针对耗时数小时、需要人工多级审批或防范服务重启的长流程，由 Temporal 状态机保障任务状态永不丢失。

---

## 九、总结与结语

构建企业级多智能体系统，绝非简单的“让几个 Agent 互相聊聊天”。Google ADK 的核心价值，正在于它深刻理解了**确定性工程秩序**与**概率性认知推理**的分工边界：

* **模式设计上**：清晰区分了**确定性工作流类（Workflow Agent）**与**上层协作模式（Multi-Agent Pattern）**；
* **控制权保障上**：明确了 **`subAgents`（转移控制权）** 与 **`AgentTool`（保留控制权）** 的本质区别；
* **演进路线上**：从早期的简单模版类，稳步走向一等公民的图状态机工作流（Graph Workflow）。

掌握这一套层次分明、动静结合的编排哲学，才能在企业复杂的生产业务中，打造出真正高可用、可审计、不失控的多智能体系统。

### 延伸阅读与参考资源

* [Google ADK 官方技术文档](https://adk.dev/)：深入阅读 Workflow Agents、Tools 及 InvocationContext 底层规范。
* [Multi-Agent Workflow Patterns 官方指引](https://adk.dev/workflows/patterns/)：学习官方推荐的架构设计模式。
* [Agent Routing 与控制权转移](https://adk.dev/agents/routing/)：深入了解 subAgents 与 transfer 机制。
* [本站多智能体系列文章：《多智能体协作技术演进与企业级落地方案》](/posts/ai/multi-agent-orchestration-framework)：深入探讨企业级多智能体底座参考架构与协议边界。
