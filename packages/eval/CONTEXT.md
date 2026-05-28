# Eval

评估框架，用于衡量 RAG Pipeline 的质量。提供数据集管理、运行器、指标计算和评判器。

当前阶段：类型定义完成，预留与 observability 的关联字段。

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

## Example dialogue

> **Dev:** "**Runner** 从 **Dataset** 中取出 100 条 **Query**，逐条执行 Pipeline。"
> **Domain expert:** "然后 **Judge** 对每条输出计算 Faithfulness **Metric**，最终汇总平均分。"

> **Dev:** "我想从 observability 的 trace 中生成 eval 样本。"
> **Domain expert:** "用 **TraceEvalSample**，它可以从 trace 中提取 query、answer、candidates 等信息，然后你可以用这些信息进行 eval。"
