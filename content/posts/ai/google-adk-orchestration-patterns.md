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

```text
┌────────────────────────────────────────────────────────────────────────┐
│           Multi-Agent Pattern（多智能体协作模式 · 顶层架构设计模式）      │
│  Supervisor · Coordinator/Dispatcher · Handoff · Hierarchical · ...    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 组装与编排
┌───────────────────────────────────▼────────────────────────────────────┐
│            Workflow Agent（内置工作流类型 · 确定性代码执行原语）         │
│  SequentialAgent · ParallelAgent · LoopAgent · CustomAgent (BaseAgent) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 驱动
┌───────────────────────────────────▼────────────────────────────────────┐
│            Cognitive Execution Unit（认知执行单元 · 概率推理引擎）       │
│                 LlmAgent · AgentTool · ToolContext                     │
└────────────────────────────────────────────────────────────────────────┘
```

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

### 4.1 SequentialAgent（顺序流水线）

`SequentialAgent` 接收一个包含多个子智能体的有序列表，在被触发时，按照数组下标严格从前向后依序调度。

```text
[Input Task] ──> [Step 1: Extractor] ──(output_key)──> [Step 2: Transformer] ──(output_key)──> [Step 3: Writer] ──> [Final Result]
```

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

```text
                    ┌──> [Sub-Agent A: 性能架构分析] ──┐
[Input Task] ──Fork─┼──> [Sub-Agent B: 安全合规扫描] ──┼─Join──> [Aggregator Agent]
                    └──> [Sub-Agent C: 商业成本核算] ──┘
```

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

在复杂生成式任务中，初稿往往无法一次性满足高标准的业务规则。**`LoopAgent` 构建了“生成者-审核者（Generator-Critic）”的自愈迭代环**：

```text
            ┌────────────────────────────────────────┐
            ▼                                        │ 打回修改 (未达标)
   [Drafter / Fixer Agent] ──> [Critic / Validator] ─┴─> (满足要求 / Escalate) ──> [Exit]
```

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

## 五、重点攻坚：Java 中如何正确实现 Supervisor 模式？

在以 Java 为主力技术栈的企业中，许多团队在尝试构建“主智能体协调多个子智能体”时，往往第一直觉是给主智能体配置 `subAgents`：

### 5.1 常见误区：为什么 `subAgents` 往往不是真正的 Supervisor？

```java
// 典型误区示例：使用 subAgents 进行动态路由
LlmAgent planner = LlmAgent.builder().name("Planner").description("负责任务拆解").model(model).build();
LlmAgent executor = LlmAgent.builder().name("Executor").description("负责执行任务").model(model).build();

LlmAgent supervisor = LlmAgent.builder()
    .name("Supervisor")
    .model(model)
    .instruction("根据用户目标决定调用哪个专业智能体，全部完成后返回结果。")
    .subAgents(planner, executor) // 注意：这里使用了 subAgents！
    .build();
```

* **运行机制**：在 Google ADK 底层，`subAgents` 触发的是 **Handoff（控制权交接）** 协议。
* **致命隐患**：当 Supervisor 决定交接给 `Executor` 时，底层通过 `transferToAgent` 将**整场对话的发言权与主导权彻底转交给了 Executor**。此时 Executor 接管了与用户的上下文，它完成本职任务后，**并不会自动将控制权还给 Supervisor**！
* 除非在 Executor 内部再硬编码写指令让其把控制权转移回 Supervisor，否则系统极易发生“控制权流失”、“死在子节点”或无法在主节点统一总结的现象。

### 5.2 推荐正解：使用 `AgentTool` 实现真正的控制权不灭

如果希望 Supervisor **始终稳坐指挥席**，在调用完专员后立刻拿回结果、统一归纳并评估下一步，**必须使用 `AgentTool`（智能体工具化）**：

```java
package com.wanghuanlab.adk.supervisor;

import com.google.adk.agents.LlmAgent;
import com.google.adk.models.BaseModel;
import com.google.adk.tools.AgentTool;

public class SupervisorFactory {

    public static LlmAgent createEnterpriseSupervisor(BaseModel model) {
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

        // 2. 将专业 Agent 封装为无状态/隔离调用的标准高阶工具 (AgentTool)
        // 这一步是关键！封装后，专业 Agent 在主控眼里就是一个单次输入、确定性返回结果的 Tool
        AgentTool plannerTool = AgentTool.fromAgent(planner);
        AgentTool executorTool = AgentTool.fromAgent(executor);
        AgentTool reviewerTool = AgentTool.fromAgent(reviewer);

        // 3. 构建真正的中心化主控智能体 (Supervisor)
        return LlmAgent.builder()
            .name("MasterSupervisor")
            .model(model)
            .instruction("""
                你是企业多智能体协同系统的总指挥 (Master Supervisor)。
                你的职责：
                1. 接收用户的复杂业务诉求，首先调用 PlannerAgent 生成分步执行计划；
                2. 针对拆解出的每一步骤，调用 ExecutorAgent 获取执行结果；
                3. 将产出交付给 ReviewerAgent 进行严格质量检查，若不合格要求重新执行；
                4. 你始终拥有唯一的全局会话控制权，汇总所有专员工具的产物，向用户输出最终答卷。
                """)
            .tools(plannerTool, executorTool, reviewerTool) // 挂载为工具，而非 subAgents！
            .build();
    }
}
```

* **控制流优势**：
  * **控制权永不脱缰**：Supervisor 每次调起 `AgentTool` 时，子 Agent 在其独立的沙箱会话中单次执行完毕并返回结果字符串，控制权 100% 停留在 Supervisor 手中。
  * **主控可任意规划与重试**：Supervisor 可以根据 `reviewerTool` 返回的审核得分，自主决定是否重调 `executorTool`，真正实现动态规划。

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

```text
               ┌───────────────────────────────────────────────┐
               │    Supervisor 协调层 (LlmAgent + AgentTool)    │
               │   负责理解综合目标、动态任务拆解与结果汇总签发     │
               └───────┬───────────────────────┬───────────────┘
                       │                       │
         ┌─────────────▼─────────┐   ┌─────────▼──────────────┐
         │ 业务流水 (Sequential)  │   │ 并发分析 (Parallel)    │
         │ 固化依赖顺序，确保步骤合规 │   │ 独立多源扫描，压缩墙钟延迟 │
         └─────────────┬─────────┘   └─────────┬──────────────┘
                       │                       │
                       └───────────┬───────────┘
                                   │
                       ┌───────────▼───────────┐
                       │ 质检自愈闭环 (Loop)     │
                       │ 审核员严格把关，超标退出 │
                       └───────────┬───────────┘
                                   │
               ┌───────────────────▼───────────────────────────┐
               │   Temporal 分布式持久化底座 (Durable Engine)   │
               │    长任务保活 · 崩溃无损恢复 · 人工断点签批     │
               └───────────────────────────────────────────────┘
```

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
