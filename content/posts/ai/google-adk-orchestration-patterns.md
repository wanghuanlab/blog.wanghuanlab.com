---
title: "深入解析 Google ADK 核心编排模式：Sequential、Parallel、Loop 与工作流演进实践"
description: "从单智能体概率推理走向企业级确定性编排：深度拆解 Google Agent Development Kit (ADK) 的三大核心工作流模式（SequentialAgent、ParallelAgent、LoopAgent）、会话状态（InvocationContext）传递与破环门禁机制，结合 Archify 架构图与完整代码示例，透视从模版智能体到 ADK 2.0+ Graph Workflow 的工程演进之路。"
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
draft: false
---

大语言模型（LLM）的单点推理能力正在逼近通用认知的上限，但在真实企业级复杂业务场景中，**单智能体（Single Agent）的脆弱性暴露无遗**：上下文膨胀引发注意力退化、多步推理中的意图漂移、非确定性导致的死循环，以及外部工具链调用的脆弱容错。

解决这一工程困境的核心思想，在于**将不确定性的大模型推理约束在确定性的工程拓扑之中**。

在 Google 推出的智能体开发套件 **Google ADK（Agent Development Kit）** 中，提供了两套互补的编排范式：一套是基于大模型自主决策的推理智能体（`LlmAgent`），另一套则是以 **`SequentialAgent`（顺序流）**、**`ParallelAgent`（并发流）** 和 **`LoopAgent`（循环自愈流）** 为代表的**确定性工作流智能体（Workflow Agents）**。

本文将结合交互式架构图、底层状态机机制与生产级 Python 代码示例，深度拆解 Google ADK 的核心编排模式及其演进路径。

---

## 一、Google ADK 架构全景与运行时机制

在 Google ADK 的设计哲学中，工作流智能体本身并不依赖大语言模型来决策“下一步该谁执行”。相反，它们作为具备**严格软件工程确定性**的调度器，通过共享的上下文总线，精准驱动下属的专业子智能体。

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

## 二、模式一：SequentialAgent（顺序流水线模式）

### 2.1 拓扑语义与控制原理

`SequentialAgent` 是最基础、最直观的装配流水线（Pipeline）。它接收一个包含多个子智能体的有序列表，在被触发时，按照数组下标严格从前向后依序调度。

```
[Input Task] ──> [Step 1: Extractor] ──(output_key)──> [Step 2: Transformer] ──(output_key)──> [Step 3: Writer] ──> [Final Result]
```

* **确定性推进行为**：除非子智能体显式抛出未捕获异常或请求人工中断，否则控制权永远只能单向向前流转，绝不会发生逆流或跳步。
* **数据接力机制**：每个子智能体配置 `output_key`（如 `output_key="extracted_data"`），执行完毕后该 key 对应的值自动持久化至共享 Session State。后续智能体可以在其 Prompt 模板或工具参数中直接通过 `{extracted_data}` 引用。

### 2.2 核心代码实现

以下为使用 Google ADK 装配代码审查流水线的标准实现：

```python
from google.adk.agents import SequentialAgent, LlmAgent

# 1. 静态代码分析智能体（负责解析代码并发现隐患）
code_analyzer = LlmAgent(
    name="CodeAnalyzer",
    model="gemini-2.5-flash",
    instruction="""
    你是一名静态代码分析专家。仔细阅读用户的源码，
    提取代码中的潜在缺陷、复杂度热点和安全漏洞。
    输出必须是结构化的分析报告。
    """,
    output_key="analysis_report"
)

# 2. 修复建议智能体（消费第一步的报告，生成重构方案）
code_refactorer = LlmAgent(
    name="CodeRefactorer",
    model="gemini-2.5-flash",
    instruction="""
    你是一名高级重构工程师。请根据前序步骤的分析报告：
    {analysis_report}
    对有缺陷的代码段给出具体重构建议与修复后的代码实现。
    """,
    output_key="refactored_code"
)

# 3. 单元测试生成智能体（消费第二步的修复代码，生成测试套件）
test_generator = LlmAgent(
    name="TestGenerator",
    model="gemini-2.5-flash",
    instruction="""
    你是一名质量保证工程师。根据修复后的代码：
    {refactored_code}
    编写覆盖边界条件与异常场景的高覆盖率单元测试用例。
    """,
    output_key="test_cases"
)

# 4. 组装确定性流水线
code_review_pipeline = SequentialAgent(
    name="CodeReviewPipeline",
    sub_agents=[code_analyzer, code_refactorer, test_generator]
)
```

### 2.3 生产工程考量

* **上下文雪崩（Context Bloating）**：流水线过长时，如果每个 Agent 都将全量历史上下文向后传递，会导致末端 Agent 的输入 Token 极度膨胀甚至超出窗口。**最佳实践是在每个环节强制配置清晰的 `output_key`，只传递当前步骤的核心摘要或结构化产物**。
* **单点中断与补偿**：一旦中间某步 Agent 调用失败，全链路默认终止。生产中应在 `SequentialAgent` 外部包裹重试策略或错误处理机制。

---

## 三、模式二：ParallelAgent（并发扇出与收集模式）

### 3.1 拓扑语义与控制原理

当一个综合任务可以被拆解为多个**互不依赖、可独立推进的子维度**时，串行处理会造成巨大的时间浪费。`ParallelAgent` 实现了经典的 **Fan-Out / Gather（扇出与收集）** 拓扑：

```
                    ┌──> [Sub-Agent A: 性能架构分析] ──┐
[Input Task] ──Fork─┼──> [Sub-Agent B: 安全合规扫描] ──┼─Join──> [Aggregator Agent]
                    └──> [Sub-Agent C: 商业成本核算] ──┘
```

* **并行触发（Fork）**：`ParallelAgent` 在同一时间将共享上下文广播分发给所有配置的子智能体，各智能体异步并发执行。
* **屏障同步（Join）**：主线程在 Join 屏障处挂起等待，直到所有并发子智能体均完成执行（或达到超时阈值）后，统一收集所有产物并写入 Session State。
* **延迟优化**：端到端墙钟耗时从串行相加的 $O(\sum_{i=1}^n T_i)$ 骤降至最慢单步决定的 $O(\max(T_1, \dots, T_n) + \delta)$。

### 3.2 核心代码实现

以下展示多维度企业级方案评估的并发编排实现：

```python
from google.adk.agents import ParallelAgent, SequentialAgent, LlmAgent

# 1. 定义三个相互独立的专业评估专家
perf_expert = LlmAgent(
    name="PerformanceAuditor",
    model="gemini-2.5-flash",
    instruction="评估方案的吞吐量、P99 延迟与并发扩展瓶颈。",
    output_key="perf_analysis"
)

sec_expert = LlmAgent(
    name="SecurityAuditor",
    model="gemini-2.5-flash",
    instruction="检查方案的数据脱敏、身份鉴权、传输加密与合规漏洞。",
    output_key="sec_analysis"
)

cost_expert = LlmAgent(
    name="FinOpsAuditor",
    model="gemini-2.5-flash",
    instruction="估算云服务资源（CPU、内存、存储、网络流出）的月度财务账单。",
    output_key="cost_analysis"
)

# 2. 将三个专家放入 ParallelAgent 扇出并发池
parallel_auditors = ParallelAgent(
    name="ParallelAuditCluster",
    sub_agents=[perf_expert, sec_expert, cost_expert]
)

# 3. 定义汇总决策智能体（Gather 聚合器）
decision_maker = LlmAgent(
    name="ExecutiveSummaryAgent",
    model="gemini-2.5-flash",
    instruction="""
    基于以下三个维度的独立评审报告：
    - 性能维度：{perf_analysis}
    - 安全维度：{sec_analysis}
    - 成本维度：{cost_analysis}
    综合权衡得失，输出最终的评审结论与准入风险评级。
    """,
    output_key="final_decision"
)

# 4. 串联为完整的 并发评估 -> 综合决策 体系
audit_workflow = SequentialAgent(
    name="AuditWorkflow",
    sub_agents=[parallel_auditors, decision_maker]
)
```

### 3.3 生产工程考量

* **API 速率限制（Rate Limits）**：并发扇出瞬间会产生多倍的并发请求。如果并发子智能体数量较多，极易击穿大模型提供商的 RPM（Requests Per Minute）或 TPM（Tokens Per Minute）配额，导致 HTTP 429 异常。需要引入线程池限流或令牌桶平滑请求。
* **长尾延迟（Tail Latency）**：Join 节点的返回时间取决于最慢的一个 Agent。生产中必须配置严格的 `timeout`，并支持配置容错策略（例如允许在“至少 2/3 专家返回”时继续推进）。

---

## 四、模式三：LoopAgent（循环迭代与自愈模式）

### 4.1 拓扑语义与破环机制

前两种模式均为单向非循环图（DAG）。然而在复杂生成式任务中，初稿往往无法一次性满足高标准的业务规则。**`LoopAgent` 构建了“生成者-审核者（Generator-Critic）”的自愈迭代环**：

```
            ┌────────────────────────────────────────┐
            ▼                                        │ 打回修改 (未达标)
   [Drafter / Fixer Agent] ──> [Critic / Validator] ─┴─> (满足要求 / Escalate) ──> [Exit]
```

若缺乏工程约束，循环流极易沦为灾难性的“死循环”或“Token 燃烧器”。Google ADK 通过**两道严密的防线**实现确定性闭环控制：

1. **确定性硬上限（`max_iterations`）**：
   系统级别配置最大的完整循环次数（如 `max_iterations=3`）。一旦循环轮次耗尽，无论当前质量如何，强制终止循环并向下游抛出超时或标记。
2. **动态破环门禁（`actions.escalate`）**：
   `LoopAgent` 自身没有大模型思维能力，因此它依赖其下属的质检智能体在判断任务达标后，调用特定的“退出工具”。在工具函数内部设置 `tool_context.actions.escalate = True`，通知外层框架立即优雅中断当前循环。

### 4.2 核心代码实现

以下为包含动态退出门禁与硬轮次防线的迭代打磨实现：

```python
from google.adk.agents import LoopAgent, LlmAgent, SequentialAgent
from google.adk.tools import FunctionTool
from google.adk.tools.tool_context import ToolContext

# 1. 定义跳出循环的破环工具 (Exit Tool)
def complete_review(score: int, comment: str, tool_context: ToolContext):
    """当方案质量达到 85 分以上且无严重安全隐患时，调用此函数跳出循环。"""
    if score >= 85:
        # 设置 escalate 为 True，向外层 LoopAgent 发起破环中断信号
        tool_context.actions.escalate = True
        return {"status": "SUCCESS", "message": f"质检通过（得分: {score}），退出循环。"}
    else:
        return {"status": "REJECTED", "message": f"质检未通过（得分: {score}，原因: {comment}），触发重新修改。"}

review_tool = FunctionTool(func=complete_review)

# 2. 方案起草 / 修复智能体 (Generator)
architect_drafter = LlmAgent(
    name="ArchitectDrafter",
    model="gemini-2.5-flash",
    instruction="""
    你负责架构设计文档的起草与修正。
    如果这是首轮，请根据用户初始需求生成完整方案。
    如果 Session State 中已存在审核意见 {review_feedback}，请针对打回意见逐项修改。
    输出必须详实，包含组件拓扑与容灾策略。
    """,
    output_key="draft_proposal"
)

# 3. 严格规则质检智能体 (Critic)
compliance_checker = LlmAgent(
    name="ComplianceChecker",
    model="gemini-2.5-flash",
    tools=[review_tool],
    instruction="""
    你是一名苛刻的技术合规审查员。请仔细检查方案初稿：
    {draft_proposal}
    审查维度：
    1. 是否具备跨机房双活容灾？
    2. 是否遵循微服务隔离边界？
    
    判定规则：
    - 若完全合规且质量优良，必须调用 complete_review 工具打分并在 85 分以上。
    - 若不合规，给出明确的修改意见，输出至 review_feedback，严禁调用 complete_review。
    """,
    output_key="review_feedback"
)

# 4. 装配确定性自愈循环 (LoopAgent)
refinement_loop = LoopAgent(
    name="ArchitectureRefinementLoop",
    sub_agents=[architect_drafter, compliance_checker],
    max_iterations=3  # 硬防线：最多循环 3 轮，杜绝失控死循环
)
```

### 4.3 生产工程考量

* **模型意见振荡（Oscillation）**：Generator 与 Critic 可能在两个方案偏好间来回拉扯（如 A 坚持用 gRPC，B 坚持用 REST），导致迭代轮数耗尽仍未收敛。**应对策略是为 Critic 设定严格的定量评分 Checklist，并在 Prompt 中限定单次修改的局部范围**。
* **退化陷阱（Quality Degradation）**：多轮循环后，生成者可能为迎合某项局部规则而破坏全局架构一致性。建议在 Session State 中始终保留一份 `baseline_proposal`，作为质检时的底线对照。

---

## 五、模式融合实战：复合多智能体流水线全景

在真实生产系统落地时，几乎没有哪套企业级应用能仅凭单一模式搞定全部逻辑。业界普遍采用的方案是**“以 Sequential 为骨干流水线，局部嵌套 Parallel 采集与 Loop 质检自愈”**的复合拓扑。

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

# ==================== 1. 工具与破环门禁 ====================
def approve_deliverable(score: int, tool_context: ToolContext):
    """质检通过触发退出工具"""
    if score >= 90:
        tool_context.actions.escalate = True
        return {"status": "APPROVED", "score": score}
    return {"status": "NEEDS_REVISION", "score": score}

approval_tool = FunctionTool(func=approve_deliverable)

# ==================== 2. 并发采集集群 ====================
market_analyst = LlmAgent(name="MarketAnalyst", model="gemini-2.5-flash", instruction="提取行业竞品情报与市场容量。", output_key="market_data")
tech_analyst = LlmAgent(name="TechAnalyst", model="gemini-2.5-flash", instruction="调研技术栈成熟度与开源协议许可证合规性。", output_key="tech_data")

parallel_research = ParallelAgent(
    name="ParallelResearchPool",
    sub_agents=[market_analyst, tech_analyst]
)

# ==================== 3. 汇总与初稿起草 ====================
proposal_synthesizer = LlmAgent(
    name="ProposalSynthesizer",
    model="gemini-2.5-flash",
    instruction="基于市场情报 {market_data} 与技术情报 {tech_data}，合成项目可行性初稿。",
    output_key="draft_proposal"
)

# ==================== 4. 循环打磨与合规质检 ====================
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

# ==================== 5. 终态发布智能体 ====================
publisher = LlmAgent(
    name="PublishingAgent",
    model="gemini-2.5-flash",
    instruction="将终版方案 {refined_proposal} 生成正式的发布报告，生成执行计划。",
    output_key="final_deliverable"
)

# ==================== 6. 顶层流水线组装 ====================
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

## 六、架构演进：从模版智能体走向 ADK 2.0+ Graph Workflow

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

> **选型建议**：
> * **优先使用 Sequential / Parallel / Loop 模版**：对于结构固定、逻辑清晰的流水线式任务（如文档抽取润色、多源并发查询、代码生成复核），三大原语开箱即用，代码最简洁，心智负担最小。
> * **升级到 Graph Workflow**：当业务涉及复杂的状态机流转、多级人工审批挂起、长周期故障恢复或网状路由时，应果断拥抱图模型。

---

## 七、核心模式选型矩阵与企业工程度量

在架构设计与业务落地时，可参考以下多维选型对照矩阵：

| 编排模式 | 核心控制机制 | 墙钟延迟表现 | Token 消耗模型 | 容错复杂度 | 黄金应用场景 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Sequential** | 严格串行单向推流 | $O(\sum T_i)$（高） | 线性累加（需控上下文） | 简单（单点截断） | 标准 SOP、代码生成与测试、数据清洗流水线 |
| **Parallel** | 异步并发 Fork-Join | $O(\max T_i)$（极优） | 瞬时并发激增（需控限流）| 中等（长尾木桶效应） | 多维度独立审计、多数据源检索、多方案头脑风暴 |
| **Loop** | 反馈循环 + Escalate 门禁 | $O(k \cdot T_{loop})$（可变）| 循环成倍消耗（严格上限） | 较高（需防模型振荡） | 代码编译自愈修复、合规打分修正、文本精细校对 |
| **Graph Workflow** | 状态图驱动 + 条件边 | 视拓扑图路径而定 | 路径自适应消耗 | 高（依赖检查点底座） | 跨部门长周期业务流程、风控审批流、高可用系统 |

### 生产落地的三项工程铁律

1. **状态传递强契约化，杜绝自然语言“意会”**：
   * 所有跨 Agent 传递的 `output_key` 必须定义强类型的 JSON Schema，避免“上游少吐了一个字段，下游整体瘫痪”。
2. **循环模式必须双重保险**：
   * 严禁无 `max_iterations` 的裸 `LoopAgent` 上线。同时，必须由高规格模型或确定性代码担任 Critic，避免低智力模型产生幻觉导致死循环。
3. **全链路 OpenTelemetry 追踪贯穿**：
   * 无论是串行还是并发，所有子智能体的调用必须绑定同一全局 `trace_id` 与层级 `span_id`，确保在生产事故排查时能够秒级复现当时的调用上下文与决策链路。

---

## 八、总结与结语

构建企业级多智能体系统，早已超越了“让几个 Agent 互相聊聊天”的粗浅原型。**Google ADK 的价值，正在于它将传统的确定性软件工程秩序（流水线、并发控制、循环门禁）优雅地赋予了以不确定性为核心的大语言模型。**

* **`SequentialAgent` 规范了步骤与秩序**；
* **`ParallelAgent` 释放了算力与吞吐**；
* **`LoopAgent` 构筑了质检与自愈的防线**。

通过将这三大原语有机融合，并在高阶场景中平滑过渡到状态图工作流引擎，工程团队便能以极具确定性、可维护性和高可用性的架构底座，真正将智能体技术落地于企业的核心业务命脉。

### 延伸阅读与源码索引

* [Google ADK 官方文档与开源项目](https://github.com/google/adk-python)：深入研读 Workflow Agents、Tools 及 InvocationContext 底层源码。
* [Model Context Protocol (MCP) 规范](https://modelcontextprotocol.io/)：掌握智能体外部工具统一接入标准。
* [本站多智能体系列文章：《多智能体协作技术演进与企业级落地方案》](/posts/ai/multi-agent-orchestration-framework)：深入探讨 Supervisor、Temporal 持久化引擎与 A2A 跨组织协作。
