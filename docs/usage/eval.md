# Eval 使用指南

`@rag-sdk/eval` 用于衡量 RAG Pipeline 的质量。它**不依赖 runtime**：你把任意 `(Query) => Promise<RAGResponse>` 的实现注入 `Runner`，它就能评估。

## 核心概念

| 概念 | 类型 | 职责 |
|------|------|------|
| Dataset | `EvalDataset` | 评估数据集，含若干 `EvalSample`（query + 期望答案/期望 Chunk） |
| Metric | `Metric` | 确定性逐项比较，产出 `[0,1]` 分数 |
| Judge | `Judge` | 更主观/聚合的评判，可启发式或调用 LLM |
| Runner | `Runner` | 加载 Dataset，对每个 Sample 跑 Pipeline，收集分数并汇总 |
| EvalPipeline | `(Query) => Promise<RAGResponse>` | 被评估对象，依赖注入 |

## 内置 Metric

按 name 引用（`EvalConfig.metrics` 或 `RunnerOptions.metrics`）：

| name | 含义 |
|------|------|
| `recall@5` | 期望 Chunk 中被检索回来的比例（前 K 个） |
| `mrr` | 第一个命中期望 Chunk 的排名倒数 |
| `answer_presence` | 期望答案文本是否作为子串出现在生成答案中 |

未知 name 会抛错，避免静默漏算。需要自定义指标时实现 `Metric` 接口并通过 `RunnerOptions.metricRegistry` 注入。

## 内置 Judge

`HeuristicJudge`（不依赖外部 LLM）产出两个分数：

- `faithfulness`：答案非空且有引用 Chunk 支撑 → 1，否则 0
- `groundedness`：答案 token 中能在引用 Chunk 里找到的比例

Judge 分数以 `<judgeName>.<key>` 命名空间并入结果，如 `heuristic.faithfulness`。

## 最小示例

```ts
import { Runner, HeuristicJudge, type EvalDataset } from "@rag-sdk/eval"
import type { Query, RAGResponse } from "@rag-sdk/core"

const dataset: EvalDataset = {
  id: "qa", name: "QA", version: "v1",
  samples: [
    { id: "s1", query: "年假多少天?", expectedAnswer: "15", expectedChunks: ["c1"] },
  ],
}

// 被评估的 Pipeline（可以是 runtime.run 的适配，也可以是任意实现）
const pipeline = async (q: Query): Promise<RAGResponse> => ({
  answer: "公司年假 15 天",
  chunks: [{ id: "c1", content: "年假 15 天" }],
})

const runner = new Runner({
  metrics: ["recall@5", "mrr", "answer_presence"],
  judges: [new HeuristicJudge()],
})

const result = await runner.run(dataset, pipeline)
console.log(result.summary.scores["recall@5"].mean) // 1
```

## 从 Trace 提取评估样本

eval 也能从 observability 记录的 `RAGTrace` 反向提取样本与质量信号，无需重跑 Pipeline：

```ts
import { extractEvalSample, extractQualitySignals } from "@rag-sdk/eval"

const sample = extractEvalSample(trace)        // { query, answer, candidates, ... }
const signals = extractQualitySignals(trace)   // { emptyRetrieval, lowConfidence, highDropRate, errorOccurred }
```

`extractQualitySignals` 用于挑出需要关注的 trace（空检索、低置信、高丢弃率、出错）。

## 适配 Runtime

`Runner` 不直接依赖 runtime。要评估一个 runtime，把 `run()` 的输出适配成 `RAGResponse` 即可：

```ts
const pipeline = async (q: Query): Promise<RAGResponse> => {
  const r = await runtime.run(q)
  const gen = r.outputs.generator?.value
  const post = r.outputs.postprocessor?.value
  return { answer: gen?.answer ?? "", chunks: post?.candidates ?? [] }
}
```
