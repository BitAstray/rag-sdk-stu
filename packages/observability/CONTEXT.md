# Observability

RAG 链路观测与诊断层。结构化记录 RAG 运行时证据，回答三个核心问题：为什么答成这样？哪里慢/哪里失败？质量怎么持续改进？

## Language

**Observer** (RAGObserver):
统一观察接口，用于接收 RAG 事件、错误和 trace 生命周期通知。专注于观测而非管线扩展。
_Avoid_: listener, subscriber

**Exporter** (TraceExporter):
Trace 输出接口，将 RAGTrace 输出到特定目标（console、memory、JSONL、HTTP 等）。
_Avoid_: writer, sink

**RedactionMiddleware**:
数据脱敏中间层，位于 Observer 和 Exporter 之间，负责字段脱敏和内容截断。
_Avoid_: sanitizer, filter

**SamplingMiddleware**:
采样中间层，位于 RedactionMiddleware 之前，决定是否采样当前 trace。
_Avoid_: rate limiter

**Trace** (RAGTrace):
一次 runtime.run 或 runIndexing 的顶层观测单元，包含事件、错误和指标。Observer 内部管理 Trace 生命周期。
_Avoid_: span, log

**Event** (RAGEvent):
阶段边界和关键决策的事实记录，命名格式为 `<scope>.<stage>.<action>`。name 用于精确匹配，stage 用于快速过滤。
_Avoid_: log entry, record

**Metric** (RAGMetric):
可量化的性能指标（延迟、吞吐量、错误率等）。
_Avoid_: stat, measurement

**Attributes** (RAGAttributes):
事件和 trace 的结构化字段，类型为 `Record<string, JsonValue>`。约定尽量扁平，但允许嵌套。
_Avoid_: metadata, properties

## Relationships

- **Observer** 专注于接收观测事件，不参与管线扩展
- **Observer** → **RedactionMiddleware** → **Exporter**：数据流向
- **SamplingMiddleware** 在 RedactionMiddleware 之前执行，决定是否采样
- **Trace** 记录一次 Pipeline 执行的全过程
- **Event** 是 Trace 的组成部分，记录阶段边界和决策
- **Metric** 从 Trace 中聚合产出

## Design decisions

1. **RAGObserver 专注于观测** — Observer 用于观测，不参与管线扩展
2. **RAGEvent 保留 name 和 stage 两个字段** — stage 用于快速过滤，name 用于精确匹配
3. **TraceContext 是创建时输入，RAGTrace 是最终输出** — 字段重复是刻意设计
4. **Observer 错误隔离** — 吞掉错误，通过 `onObserverError` 回调通知调用方
5. **Observer 生命周期** — `flush()` 由 runtime/indexing 自动调用，`shutdown()` 由调用方负责
6. **数据流向** — Observer → RedactionMiddleware → Exporter
7. **采样时机** — 先采样再脱敏，未被采样的 trace 直接丢弃
8. **createConsoleObserver 是独立实现** — 不经过 Exporter 抽象
9. **RAGAttributes 使用 JsonValue** — 约定尽量扁平，但允许嵌套
10. **事件名校验** — 始终校验，格式不正确时记录 warning
11. **Observer 方法异步** — fire-and-forget，不阻塞主流程
12. **Trace 生命周期由 Observer 内部管理** — 接收到第一个事件时创建，接收到 run.complete 或 run.fail 事件时结束
13. **Redaction 字段路径** — 支持正则表达式

## Example dialogue

> **Dev:** "我创建了一个 **Observer** 来监控 runtime 的执行。"
> **Domain expert:** "Observer 会接收到 **Event**，经过 **RedactionMiddleware** 脱敏后，由 **Exporter** 输出到目标。"

> **Dev:** "我想记录每次检索的耗时。"
> **Domain expert:** "Observer 会在 `runtime.retrieval.start` 和 `runtime.retrieval.complete` 事件中记录耗时，你可以用这些事件来分析性能瓶颈。"
