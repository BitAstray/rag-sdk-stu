# Observability

可观测性层，提供钩子、追踪和指标能力。作为横切关注点，可被其他包引用。

## Language

**Hook**:
管线执行过程中的扩展点，允许在特定阶段注入自定义逻辑。
_Avoid_: callback, interceptor

**Trace**:
一次管线执行的完整追踪记录，包含各阶段的耗时和状态。
_Avoid_: span, log

**Metric**:
可量化的性能指标（延迟、吞吐量、错误率等）。
_Avoid_: stat, measurement

## Relationships

- **Hook** 可以挂载到 Pipeline 的任意阶段
- **Trace** 记录一次 Pipeline 执行的全过程
- **Metric** 从 Trace 中聚合产出

## Example dialogue

> **Dev:** "我在 **Retriever** 阶段挂了一个 **Hook** 来记录每次检索的耗时。"
> **Domain expert:** "这些数据会汇入 **Trace**，最终聚合成 **Metric** 用于监控。"
