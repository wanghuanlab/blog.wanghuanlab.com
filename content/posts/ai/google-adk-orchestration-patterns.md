---
title: "深入解析 Google ADK 核心编排模式：Sequential、Parallel、Loop 与多智能体架构演进实践"
description: "区分 Google ADK 工作流类型与多智能体协作模式，解析 Sequential、Parallel、Loop、Supervisor 与 Handoff 的控制流和状态边界，提供带确定性质检门禁的 Python 示例，并讨论 Java、ADK 2.0 Graph、A2A、MCP 与 Temporal 的适用条件。"
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

复杂业务中的智能体系统，既需要大模型理解模糊需求，也需要程序保证执行顺序、权限边界和失败处理。将任务拆给多个 Agent 可以缩小单个角色的职责范围，但也会增加通信、状态管理和验收成本。

Google ADK（Agent Development Kit）提供工作流编排与智能体协作机制。理解这些机制的关键，是分清三个问题：**谁决定下一步、数据如何传递、什么条件允许继续执行**。确定性的编排可以约束执行路径，但不会自动保证模型输出正确、工具操作安全或业务任务一定成功。

> **版本与示例范围（核对日期：2026-10-23）**
>
> 本文以经典模板工作流解释 Sequential、Parallel、Loop；Python 经典示例按 `google-adk==1.16.0` 的 API 编写，便于明确复现边界，不代表推荐新项目停留在该版本。Java 示例采用 `AgentTool.create(...)`，已使用本地 `com.google.adk:google-adk:1.12.0` 依赖与 JDK 21 编译检查；切换版本后仍需重新验证。ADK 2.x 的 Graph 与协作模式另行说明，不能直接将其运行时语义套用到 1.x 示例。
>
> Python 示例已在锁定版本中完成导入与对象构造校验；完整流程使用假模型验证了通过、拒绝、无效输出与新任务状态重置，未调用真实模型验证输出质量。Java 示例完成编译检查，尚未调用模型执行。
>
> 代码展示编排结构与门禁设计。除明确提供的工具外，角色名称和 Prompt 不会赋予 Agent 检索、执行测试或扫描代码的能力；实际运行需要模型凭据、可用模型及业务工具。本文不将这些示例宣称为完成生产验证的系统。

## 一、先区分工作流类型与协作模式

::archify-diagram{src="/diagrams/adk-pattern-vs-workflow.html" title="Google ADK：工作流机制与协作模式" height="500"}
::

**工作流类型**是框架提供的执行机制，例如 `SequentialAgent`、`ParallelAgent`、`LoopAgent`。它们用代码安排子节点执行，不依赖 LLM 来选择容器内的常规执行顺序。`Workflow Agent` 在这里是类别名称，不应据此假定所有 SDK 都存在一个名为 `WorkflowAgent` 的可实例化类。

**协作模式**是系统的组织方式，例如 Coordinator、Supervisor、Hierarchical、Generator–Reviewer。它们通过组合工作流、LLM Agent、工具调用和控制权转移实现，并不必然对应同名内置类。

二者可以嵌套：Supervisor 可以选择调用哪个专业流程；流程内部再以 Sequential 固定步骤、Parallel 执行独立任务、Loop 进行有限轮次的修订。也可以完全不设 Supervisor，由代码直接运行固定流程。

## 二、主要模式与适用条件

| 模式或机制 | 主要实现 | 适用场景 | 需要额外设计的边界 |
| :--- | :--- | :--- | :--- |
| Sequential | `SequentialAgent` | 有明确前后依赖的步骤 | 状态键、失败策略、业务前置条件 |
| Parallel | `ParallelAgent` | 互不依赖的检索或分析 | 并发限额、超时、状态写冲突、结果汇总 |
| Loop | `LoopAgent` | 生成、审查、修改 | 轮次上限、退出条件、未达标后的处理 |
| Coordinator / Handoff | LLM 路由与 transfer | 专业客服分流、会话接管 | 谁负责后续回复、如何返回或再次转接 |
| Supervisor | Agent-as-tool；适用版本的任务委派 | 动态拆解、收集结果、重新规划 | 调用预算、返回契约、最终验收 |
| Hierarchical | 嵌套 Agent 或子流程 | 分层拆解复杂任务 | 层级深度、状态归属、调度成本 |
| Generator–Reviewer | 顺序生成与审查，必要时加循环 | 文稿修订、代码检查 | 审查标准、客观验证、失败出口 |
| Human-in-the-loop | Tool Confirmation、人工输入与外部审批服务 | 需要授权或补充信息的操作 | 审批身份、结果绑定、挂起与恢复 |
| Custom workflow | 对应版本的自定义 Agent / Node | 特殊分支、补偿、限流 | SDK 生命周期及升级兼容性 |
| Graph workflow | ADK 2.x `Workflow` 等语言对应 API | 显式分支、节点组合、人工输入 | 图校验、存储配置、恢复与重试语义 |

Java 提供经典工作流与 AgentTool 等能力，但不同语言 SDK 的功能和发布版本并不完全对齐。不要仅依据 Python 示例推断 Java 存在同名方法；具体能力应查对应语言的 API 与发行说明。

## 三、运行时：上下文、状态与事件

::archify-diagram{src="/diagrams/google-adk-architecture-patterns.html" title="Google ADK 编排运行时概念图" height="560"}
::

可以从以下三个角度理解运行时。这里是便于阅读的概念划分，并非官方固定的“三平面架构”。

1. **调用上下文**：`InvocationContext` 包含单次调用所需的运行信息，以及访问会话、服务与配置的入口。它不等于可以直接序列化并恢复的业务快照。
2. **会话状态**：经典 Python `LlmAgent` 的 `output_key` 可将最终输出写入状态；后续 instruction 可通过 `{key}` 读取。普通文本不会因配置了 `output_key` 就变成强类型对象，结构化输出还需 Schema 和校验。状态是否持久保存，取决于 SessionService 与部署方式。
3. **事件与动作**：执行过程产生 Event，其 `state_delta` 记录状态变更，`transfer_to_agent` 表示控制权转移，`escalate` 在 LoopAgent 中可触发退出。**退出循环、会话转接、人工审批是不同机制**，不能互相代替。

缺失的必填状态键可能导致模板注入报错；重复会话中的旧值也可能污染新任务。每次新业务任务应明确初始化状态，长流程恢复则应保留已经提交的进度，避免无条件重置。

## 四、三大经典工作流原语

::archify-diagram{src="/diagrams/adk-three-primitives-comparison.html" title="Sequential、Parallel、Loop 执行方式对比" height="460"}
::

### 4.1 SequentialAgent：固定执行顺序

Sequential 按配置顺序运行子 Agent。它保证容器层面的步骤次序，不保证每个子 Agent 的输出正确，也不会自动将“返回了一段错误说明”识别成业务失败。若后续步骤依赖前置结果合法，应由代码显式校验。

```python
from google.adk.agents import LlmAgent, SequentialAgent

analyzer = LlmAgent(
    name="CodeAnalyzer",
    model="gemini-2.5-flash",
    instruction="分析用户提供的源码，列出潜在缺陷；不要声称运行过测试。",
    output_key="analysis_report",
)
refactorer = LlmAgent(
    name="CodeRefactorer",
    model="gemini-2.5-flash",
    instruction="根据报告 {analysis_report} 给出修复建议，注明尚未验证的假设。",
    output_key="refactoring_suggestions",
)
code_pipeline = SequentialAgent(
    name="CodePipeline",
    sub_agents=[analyzer, refactorer],
)
```

这里的 `{analysis_report}` 是 instruction 模板注入，不应推广为“任意工具参数都会自动替换占位符”。磁盘文件、源码和测试结果仍需要调用方提供，或通过工具读取。

### 4.2 ParallelAgent：独立任务并发

Parallel 并发运行配置的子任务，正常情况下等待所有分支完成。它本身不负责把各分支的结论综合成一个业务答案，常见做法是在后面增加汇总 Agent。

```python
from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent

performance = LlmAgent(
    name="PerformanceReview",
    model="gemini-2.5-flash",
    instruction="基于用户给出的代码与指标分析性能风险，区分实测与推测。",
    output_key="performance_findings",
)
security = LlmAgent(
    name="SecurityReview",
    model="gemini-2.5-flash",
    instruction="基于用户给出的代码分析安全风险，注明缺失的验证证据。",
    output_key="security_findings",
)
parallel_reviews = ParallelAgent(
    name="ParallelReviews",
    sub_agents=[performance, security],
)
summary = LlmAgent(
    name="ReviewSummary",
    model="gemini-2.5-flash",
    instruction="汇总性能分析 {performance_findings} 与安全分析 {security_findings}。",
)
audit_pipeline = SequentialAgent(
    name="AuditPipeline", sub_agents=[parallel_reviews, summary],
)
```

分支使用不同状态键，避免同时覆盖同一结果。状态更新会随执行事件发生，并不是所有分支完成后才一次性写入。超时、失败取消与降级需要结合 SDK 和调用配置单独设计。

在资源充足且任务独立时，总耗时可以接近 `max(T_i) + 调度开销`；限流、连接池、模型服务排队和长尾任务都会削弱收益。并发通常缩短等待时间，并不自动减少 Token 总量。

### 4.3 LoopAgent：有限轮次的反馈修订

Loop 在每轮中依次运行子 Agent，并在收到 `escalate=True` 或达到 `max_iterations` 后停止。建议同时配置轮次上限、单次模型调用预算及外层超时。

```python
from google.adk.tools.tool_context import ToolContext


def exit_loop(tool_context: ToolContext) -> dict:
    """在调用方已经确认退出条件满足后，通知 LoopAgent 停止。"""
    tool_context.actions.escalate = True
    return {"loop_exit_requested": True}
```

这个工具仅展示退出信号。若让模型自主判断是否调用，它仍然依赖模型的行为。重要门禁更适合由确定性代码读取审查结果并发出事件，第六节给出这种写法。

**达到轮次上限仅代表停止迭代，不代表审批通过，也不会自动抛出超时异常。** 循环后必须检查业务状态，决定交付、人工复核或失败终止。

## 五、Supervisor：控制流、工具权限与远程协作

### 5.1 先决定需要哪一种委派

Supervisor 负责拆解任务、选择专员并综合结果。它适合路径需要动态调整的任务；固定步骤直接用工作流通常更容易验证，也省去额外规划调用。

不能简单概括为“`sub_agents` 一定丢失控制权，AgentTool 才是唯一正解”。经典会话转接与当前协作模式的区别如下：

| 机制 | 行为 | 适用条件 |
| :--- | :--- | :--- |
| 经典 LLM transfer / `chat` 子 Agent | 目标 Agent 接管对话，返回需要再次转接 | 需要专业角色继续与用户交流 |
| `AgentTool` | 子 Agent 作为工具执行，结果返回调用者 | 经典工具式委派；注意状态与恢复限制 |
| ADK 2.x `single_turn` 子 Agent | 专员完成任务后自动返回结果 | 不需要与用户交互的独立任务 |
| ADK 2.x `task` 子 Agent | 可以澄清任务，通过完成机制返回 | 需交互的任务委派，受版本与运行位置限制 |

当前官方 Python 示例推荐以 `single_turn` 子 Agent 替代旧的 AgentTool 用法；`task` 在部分图工作流版本中有限制。这里的模式配置不能假定 Java SDK 同步支持，需查目标版本。[官方协作模式](https://adk.dev/workflows/collaboration/)、[single-turn 示例](https://github.com/google/adk-python/tree/main/contributing/samples/multi_agent/single_turn_sub_agent)

### 5.2 经典 AgentTool：Java 与 Python 写法

下面的 Java 工厂展示“将 Agent 暴露为工具”的构造方式。专员的 `description` 用于帮助主模型选择工具，`instruction` 才定义专员自身的行为。示例没有连接 CI 或扫描器，Reviewer 只能给出审查意见。

```java
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.AgentTool;

public final class SupervisorFactory {
    private SupervisorFactory() {}

    public static LlmAgent create(String modelName) {
        LlmAgent planner = LlmAgent.builder()
            .name("Planner")
            .description("根据需求拆解实现步骤")
            .instruction("输出实现计划、依赖与验收条件。")
            .model(modelName)
            .build();
        LlmAgent reviewer = LlmAgent.builder()
            .name("Reviewer")
            .description("检查方案缺陷与证据不足之处")
            .instruction("审查输入方案，列出问题；不要声称运行过测试或扫描。")
            .model(modelName)
            .build();
        return LlmAgent.builder()
            .name("Supervisor")
            .model(modelName)
            .instruction("调用 Planner 制定计划，再将计划交给 Reviewer，汇总意见。")
            .tools(AgentTool.create(planner), AgentTool.create(reviewer))
            .build();
    }
}
```

Python 1.x 对应方式是直接构造 AgentTool，而不是调用 `from_agent`：

```python
from google.adk.agents import LlmAgent
from google.adk.tools import AgentTool

planner = LlmAgent(
    name="Planner",
    description="根据需求输出实现计划",
    model="gemini-2.5-flash",
    instruction="给出实施步骤、依赖和验收条件。",
)
supervisor = LlmAgent(
    name="Supervisor",
    model="gemini-2.5-flash",
    instruction="需要规划时调用 Planner，并说明计划中的假设。",
    tools=[AgentTool(agent=planner)],
)
```

以上 Prompt 表达了期望策略，但不构成“必定调用规划器”“必定审查”的硬约束。若业务要求每次都执行这些步骤，应由工作流或自定义控制器固化。

AgentTool 可以减少主模型直接看到的子调用细节，但不是进程或安全沙箱。实现可能复制父状态并回写子调用的状态变更；返回结构是否受约束取决于 Schema 配置。临时子会话也不等于可恢复的长任务，应特别验证子 Agent 的人工审批与挂起恢复是否受支持。[Python 实现](https://github.com/google/adk-python/blob/main/src/google/adk/tools/agent_tool.py)、[Java 实现](https://github.com/google/adk-java/blob/main/core/src/main/java/com/google/adk/tools/AgentTool.java)

### 5.3 参考架构与业务工具归属

::archify-diagram{src="/diagrams/adk-supervisor-architecture-deep-dive.html" title="Supervisor 企业参考架构：调度、领域工具与治理" height="600"}
::

这张图是可选的企业参考架构，不是 ADK 默认部署时自动具备的功能清单。接入网关、注册中心、持久化编排、审批集成和业务 MCP 服务都需要具体实现或配置。

对于工具多、权限复杂的系统，优先将 Git/CI、数据库查询、代码扫描等能力按领域配置给专员，Supervisor 保留必要的调度、全局查询与流程治理工具。小型应用只有少量业务工具时，也可以由 Supervisor 直接调用，无需为每个工具增加一层 Agent。

| 工具或能力 | 建议归属 | 约束应落在哪里 |
| :--- | :--- | :--- |
| 任务委派与全局状态查询 | Supervisor / 控制器 | 调用预算、任务范围、可访问的专员 |
| Git/CI 与执行环境 | 研发专员或专门执行服务 | 仓库权限、命令白名单、发布审批 |
| 数据库与数据湖 | 分析专员，或受限查询工具 | 服务端只读账户、租户过滤、查询限额 |
| 质量扫描与测试 | Reviewer 对应工具或确定性步骤 | 实际报告、测试结果、可复现证据 |
| 人工审批 | 工具执行边界与审批服务 | 审批身份、参数绑定、有效期、防重放 |

工具下沉能改善职责分工和工具选择范围，但主控仍可能通过专员间接触发操作。**最小权限必须由凭据、服务端授权和工具实现落实**，不能依赖角色 Prompt 或组织层级作为安全边界。只读工具也可能返回敏感数据，是否放行仍取决于数据权限。

### 5.4 本地协作、A2A 与 MCP 的边界

本地 Agent 可以通过工作流、transfer 或工具式委派协作，不需要引入网络协议。AgentTool 避免的是额外的跨服务 Agent RPC，模型调用和工具访问仍可能走网络，不能据此声称“微秒级完整执行”或“零网络开销”。

A2A 用于远程智能体的互操作，提供消息、任务状态、产物与流式更新等协议能力，适合独立部署、跨团队或跨框架的智能体服务。A2A 并不强制采用主管—专员关系，也不自动决定谁有审批权。[A2A 规范](https://a2a-protocol.org/latest/specification/)

`Task Envelope` 可以作为应用自己的封装名称，但不能把 TraceID、AuthToken、Deadline 的自定义组合写成 A2A 固定标准字段。业务进度百分比同样需要约定；ADK 的 `EventActions.escalate` 也不是 A2A 标准的 `EscalateAction`。鉴权凭据应通过规定的认证机制处理，不应随意嵌入任务文本。

MCP 用于向客户端暴露工具、资源与提示模板。标准传输包括 stdio 和 Streamable HTTP；旧 HTTP+SSE 属于兼容路径，SSE 也可作为 Streamable HTTP 中的流式响应方式。[MCP 传输规范](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)

```text
Supervisor / 确定性控制器
  ├─ 本地委派：工作流、AgentTool 或适用版本的协作模式
  └─ 远程委派：A2A 客户端 → 远程 Agent 服务
       └─ 专业 Agent → 经授权的 MCP 工具 / 普通 API

少量全局查询工具也可直接提供给 Supervisor。
鉴权、审批、审计应覆盖最终工具操作边界。
```

### 5.5 可靠性与人工审批

Session State、长期记忆与持久化执行解决不同问题。会话服务保存状态和事件；记忆服务提供跨任务检索；持久化编排则管理跨进程故障后的业务进度。保存会话记录不等于任意执行位置都能恢复。

Temporal 可以作为长流程的外层编排：确定性 Workflow 保存业务步骤，LLM、ADK 调用和外部副作用放在 Activities 中。恢复时重放的是 Workflow 历史，不是任意 Supervisor 内存或 Activity 内部指令位置。Activity 重试可能再次调用模型或业务 API，因此需要合理拆分步骤、保存结果，并对写操作设计幂等键、去重和必要的补偿。[Temporal 执行与重放](https://docs.temporal.io/workflow-execution)

人工审批应使用目标 SDK 支持的 Tool Confirmation、图节点人工输入，或外部工作流审批。审批必须绑定具体操作参数和产物版本，参数变化后应重新确认；拒绝、超时和重复回调都要有明确处理。`actions.escalate` 仅作为循环退出信号使用，不能代替可恢复的审批。[ADK Tool Confirmation](https://adk.dev/tools-custom/confirmation/)

可观测性应同时记录步骤耗时、调用次数、错误、成本和验收结果。决策步数与 Token 上限需根据任务测量配置；模型的 `max_output_tokens` 应设置在支持它的生成配置中，不能假定 AgentTool 自身提供这个构造参数。

## 六、复合流程：并发分析、循环修订与确定性门禁

::archify-diagram{src="/diagrams/google-adk-workflow-lifecycle.html" title="复合工作流：循环退出后仍需检查批准状态" height="520"}
::

下面把三种经典工作流组合起来，重点展示状态与失败出口。它基于用户已经提供的材料做分析，没有接入互联网检索工具；最后一步只生成交付报告，不执行外部发布。

流程分为：并发分析 → 初稿 → 有限轮次修订与审查 → 批准检查 → 报告生成。模型负责输出审查意见；代码负责验证报告结构、比较阈值、退出循环和阻止未批准的结果进入下游。

```python
# 经典 Python API 示例：google-adk==1.16.0
from typing import AsyncGenerator

from pydantic import BaseModel, Field
from google.adk.agents import BaseAgent, LlmAgent, LoopAgent, ParallelAgent, SequentialAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions

MODEL = "gemini-2.5-flash"


class ReviewReport(BaseModel):
    score: int = Field(ge=0, le=100)
    feedback: str = Field(min_length=1)


def initialize_task(callback_context: CallbackContext) -> None:
    # 本示例每次根调用代表一项新任务，不用于中途恢复或多轮审批。
    callback_context.state["approved"] = False
    callback_context.state["critic_opinion"] = "首次修订：检查逻辑、证据和风险。"
    callback_context.state["current_proposal"] = ""
    callback_context.state["review_report"] = {}
    callback_context.state["market_data"] = ""
    callback_context.state["tech_data"] = ""
    callback_context.state["final_deliverable"] = ""


class ReviewDecision(BaseAgent):
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        raw = ctx.session.state["review_report"]
        report = (
            ReviewReport.model_validate_json(raw)
            if isinstance(raw, str)
            else ReviewReport.model_validate(raw)
        )
        approved = report.score >= 90
        yield Event(
            author=self.name,
            actions=EventActions(
                state_delta={
                    "approved": approved,
                    "critic_opinion": report.feedback,
                },
                escalate=approved,
            ),
        )


class RequireApproval(BaseAgent):
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        if ctx.session.state.get("approved") is not True:
            raise RuntimeError("修订次数耗尽且未通过审查：停止生成交付报告，转人工复核。")
        yield Event(author=self.name, actions=EventActions())


market = LlmAgent(
    name="MarketAnalyst", model=MODEL,
    instruction="仅根据用户提供的材料分析市场假设，标明缺乏证据之处。",
    output_key="market_data",
)
tech = LlmAgent(
    name="TechAnalyst", model=MODEL,
    instruction="仅根据用户提供的材料分析技术可行性，列出待验证风险。",
    output_key="tech_data",
)
research = ParallelAgent(name="ParallelAnalysis", sub_agents=[market, tech])
synthesizer = LlmAgent(
    name="ProposalSynthesizer", model=MODEL,
    instruction="基于市场分析 {market_data} 与技术分析 {tech_data} 形成初稿。",
    output_key="current_proposal",
)
drafter = LlmAgent(
    name="RefiningDrafter", model=MODEL,
    instruction="修订当前方案 {current_proposal}，处理意见 {critic_opinion}。只输出新版方案。",
    output_key="current_proposal",  # 覆盖最新版，下一轮继续在它的基础上修订
)
critic = LlmAgent(
    name="StrictCritic", model=MODEL,
    instruction=(
        "审查当前方案 {current_proposal} 的逻辑、证据和风险说明。"
        "按输出 Schema 返回 score（0—100）与 feedback；不要执行审批或工具调用。"
    ),
    output_schema=ReviewReport,
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
    output_key="review_report",
)
refinement = LoopAgent(
    name="QualityLoop",
    sub_agents=[drafter, critic, ReviewDecision(name="ReviewDecision")],
    max_iterations=3,
)
formatter = LlmAgent(
    name="ReportFormatter", model=MODEL,
    instruction="将已审查方案 {current_proposal} 整理为报告，保留假设与未验证风险。",
    output_key="final_deliverable",
)
root_agent = SequentialAgent(
    name="EnterpriseDeliveryPipeline",
    before_agent_callback=initialize_task,
    sub_agents=[
        research,
        synthesizer,
        refinement,
        RequireApproval(name="ApprovalGate"),
        formatter,
    ],
)
```

`ReviewDecision` 通过事件提交状态变更，并让 LoopAgent 在通过时退出；`RequireApproval` 则在循环结束后再次检查状态。低于阈值的结果不会因为“已经循环三次”而自动获得批准。无效审查数据会触发校验异常，调用方应记录失败并提供人工处理入口。

这仍有三项明确限制：

- **模型评分是主观判断**。代码保证按阈值路由，不保证评分客观。代码类任务还应接入真实测试、静态检查和安全扫描；高风险业务要增加人工审批。
- **报告整理可能引入新内容**。如需保证最终交付物与已批准版本完全一致，应直接返回已批准原文；对外发布前按最终产物重新验收，并绑定版本或内容哈希。
- **本示例不实现断点恢复和自动派单**。异常会阻止后续步骤，调用方负责将其转为错误响应或人工工单。长任务应另行设计会话隔离、持久化、重试及恢复策略。

## 七、ADK 2.x Graph：明确表达节点与路由

ADK 2.0 已提供图工作流，官方列出的语言包括 Python、Go 和 TypeScript。Java 的能力需独立检查，不能按其他 SDK 的版本号推断支持。[ADK 2.0 与迁移说明](https://adk.dev/2.0/)

Graph 的价值是将工作节点、边、分支和输入输出关系显式表达。传统模板依然适合解释顺序、并发与循环，但新项目应查看目标版本的迁移建议；例如当前 Python 开发分支已将经典 LoopAgent 标记为弃用，这不意味着本文锁定的 1.x 版本不存在该类。

| 维度 | 经典模板工作流 | ADK 2.x 图工作流 |
| :--- | :--- | :--- |
| 流程表达 | 通过容器嵌套组合步骤 | 通过显式节点与边表达关系 |
| 分支与循环 | 组合原语或编写自定义 Agent | 使用该语言 SDK 支持的路由与动态流程机制 |
| 数据流 | 主要依靠会话状态与显式读取 | 可明确声明节点输入输出，仍需契约校验 |
| 人工输入 | 工具确认或外层机制，取决于版本 | 支持对应节点的人工输入与恢复机制 |
| 持久化与恢复 | 取决于会话服务和可恢复执行配置 | 仍取决于运行时、存储与节点重试配置 |

图的表现力有边界，不应把它描述成“任意跳转都合法”或“有图就自动持久化”。DAG 特指无环有向图，不能同时把所有循环流程都称作 DAG。实际图结构受编译校验与运行时规则限制，应针对目标 API 验证。[Python 图工作流指南](https://github.com/google/adk-python/blob/main/docs/guides/workflow/graph/index.md)

Temporal 也不是 Java 使用 ADK 的必需组件。只有任务确实跨进程重启、等待时间很长，或需要可靠重试与补偿时，外层持久化编排的收益才更明确；短任务先用简单结构更容易维护。

## 八、选型与落地顺序

::archify-diagram{src="/diagrams/adk-enterprise-composite-architecture.html" title="可选复合架构：Supervisor、工作流与持久化编排" height="540"}
::

| 业务条件 | 优先考虑 | 验证重点 |
| :--- | :--- | :--- |
| 步骤固定且前后依赖明确 | Sequential 或顺序图 | 前置结果合法性与失败中止 |
| 多项任务互不依赖 | Parallel 或图的并行分支 | 状态隔离、资源配额、部分失败 |
| 需要反复修订 | 有上限的 Loop 或循环图 | 未通过时的出口、客观质量指标 |
| 需要动态分解与选专家 | Supervisor / Coordinator | 任务契约、调用预算、返回机制 |
| 需要专家持续与用户对话 | Handoff / chat 协作 | 会话归属与返回策略 |
| 需要长时间等待或跨重启恢复 | 持久化运行时或外层工作流 | 重放、幂等、审批与业务状态一致性 |

建议先用最少的 Agent 跑通业务，再依据证据拆分角色：工具太多导致选择困难、上下文成本过高、权限需要独立管理，或某类任务需要单独扩容，都是合理的拆分依据。

上线前至少验证以下失败路径：缺少输入、分支超时、审查结果格式错误、循环次数耗尽、审批拒绝、工具重试与重复回调。记录成功率、质量、端到端耗时与成本，用测量结果决定是否增加层级或并发。

## 九、结语与参考资料

ADK 的编排机制提供控制流与协作基础。可靠系统还需要把状态契约、工具权限、客观验收和恢复策略落实到代码与服务边界。选型时先确认 SDK 版本，再根据任务特点组合顺序、并发、循环与委派，避免让 Prompt 承担本应由程序保证的业务约束。

- [Google ADK 官方文档](https://adk.dev/)
- [工作流设计模式](https://adk.dev/workflows/patterns/)
- [协作模式与返回行为](https://adk.dev/workflows/collaboration/)
- [Agent 路由](https://adk.dev/agents/routing/)
- [ADK 2.0 迁移说明](https://adk.dev/2.0/)
- [本站：《多智能体协作技术演进与企业级落地方案》](/posts/ai/multi-agent-orchestration-framework)
