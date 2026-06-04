# Eval

评估框架，用于衡量 RAG Pipeline 的质量。提供数据集管理、运行器、指标计算和评判器。

当前阶段：最小可用闭环已落地（ADR-006）。`Runner` + 内置 `Metric`（RecallAtK/MRR/AnswerPresence）+ `HeuristicJudge` + trace 提取（`extractEvalSample`/`extractQualitySignals`）。配套 demo 与单元测试。

## Language

**Dataset** (EvalDataset):
评估用的数据集，包含查询和期望的答案/引用。
_Avoid_: test set, benchmark

**Sample** (EvalSample):
数据集中的单个评估样本，包含 query 和期望结果。
_Avoid_: test case, example

**Runner**:
执行评估流程的组件，运行 Pipeline 并收集结果。
_Avoid_: executor, evaluator

**Judge**:
对 Pipeline 输出进行质量评判的组件（如相关性、忠实度）。
_Avoid_: grader, scorer

**Metric**:
评估指标的计算逻辑（如 Recall@K、MRR、Faithfulness）。
_Avoid_: score, measurement

**TraceEvalLink**:
Trace 与 Eval 的关联，用于从 observability trace 中提取 eval 相关信息。
_Avoid_: trace reference

**TraceEvalSample**:
从 Trace 提取的 Eval 样本，用于从 observability trace 中生成 eval 样本。
_Avoid_: trace sample

## Relationships

- **Runner** 加载 **Dataset**，执行 Pipeline，收集输出
- **Judge** 对 Pipeline 输出进行评判，产出 **Metric**
- **Dataset** 包含 Query[] 和对应的期望 Chunk[]/答案
- **TraceEvalLink** 将 observability 的 trace 与 eval 的 sample 关联
- **TraceEvalSample** 从 trace 中提取 query、answer、candidates 等信息用于 eval

## Dependencies

**Eval 依赖 Core 和 Observability**：

- **Core**: 使用 Core 的数据类型（Query, Chunk, RAGResponse）
- **Observability**: 使用 Observability 的 trace 数据结构（RAGTrace, RAGEvent）提取 eval 样本

**Eval 不直接依赖 Runtime**：
- Eval 通过 Observability 的 trace 数据结构获取 Pipeline 执行结果
- Runner 通过依赖注入的 `EvalPipeline`（`(Query) => Promise<RAGResponse>`）调用任意 Pipeline 实现，不直接依赖 Runtime 包
- 这种设计使得 Eval 可以评估任何 Pipeline 实现，不仅仅是 Runtime

## Design decisions

1. **Metric 按名解析** — `EvalConfig.metrics: string[]` 通过 `resolveMetrics` 映射到实现；未知指标名抛错，避免静默漏算。
2. **Judge 与 Metric 分层** — Metric 是确定性逐项比较；Judge 承载更主观/聚合的评判（可启发式或 LLM）。Judge 分数以 `<judgeName>.<key>` 命名空间并入 scores。
3. **Runner 依赖注入 Pipeline** — 不 import runtime，落实 CONTEXT 声明的「不直接依赖 Runtime」。
4. **trace 提取落实 observability 依赖** — `extractEvalSample`/`extractQualitySignals` 从 `RAGTrace` 读取阶段事件属性产出 eval 样本与质量信号。

## Example dialogue

> **Dev:** "**Runner** 从 **Dataset** 中取出 100 条 **Query**，逐条执行 Pipeline。"
> **Domain expert:** "然后 **Judge** 对每条输出计算 Faithfulness **Metric**，最终汇总平均分。"

> **Dev:** "我想从 observability 的 trace 中生成 eval 样本。"
> **Domain expert:** "用 **TraceEvalSample**，它可以从 trace 中提取 query、answer、candidates 等信息，然后你可以用这些信息进行 eval。"

> **Dev:** "我想用 Eval 来评估我的 Runtime。"
> **Domain expert:** "Runner 会调用 Runtime 的 `run` 方法，然后从 Observability 的 trace 中提取结果进行评估。"
