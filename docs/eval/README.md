# 评估框架

衡量 RAG 生成质量的评估框架（BLEU、MRR、Faithfulness 等）。

评估（eval）与验证（verification）职责分离：验证负责代码正确性，评估负责生成效果。评测指标归 `eval` 包，禁止在 `runtime` 内编写。

参见 [ADR-002](../decisions/ADR-002-verification-system.md)。
