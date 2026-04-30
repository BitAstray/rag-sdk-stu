# Eval

评估框架，用于衡量 RAG Pipeline 的质量。提供数据集管理、运行器、指标计算和评判器。

## Language

**Dataset**:
评估用的数据集，包含查询和期望的答案/引用。
_Avoid_: test set, benchmark

**Runner**:
执行评估流程的组件，运行 Pipeline 并收集结果。
_Avoid_: executor, evaluator

**Judge**:
对 Pipeline 输出进行质量评判的组件（如相关性、忠实度）。
_Avoid_: grader, scorer

**Metric**:
评估指标的计算逻辑（如 Recall@K、MRR、Faithfulness）。
_Avoid_: score, measurement

## Relationships

- **Runner** 加载 **Dataset**，执行 Pipeline，收集输出
- **Judge** 对 Pipeline 输出进行评判，产出 **Metric**
- **Dataset** 包含 Query[] 和对应的期望 Chunk[]/答案

## Example dialogue

> **Dev:** "**Runner** 从 **Dataset** 中取出 100 条 **Query**，逐条执行 Pipeline。"
> **Domain expert:** "然后 **Judge** 对每条输出计算 Faithfulness **Metric**，最终汇总平均分。"
