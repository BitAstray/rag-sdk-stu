import type { Query, RAGResponse } from "@rag-sdk/core"
import { Runner, HeuristicJudge, type EvalDataset } from "../src/index.js"

// 最小评估闭环：内存数据集 + 注入的假 Pipeline + 内置指标 + 启发式评判器。

const dataset: EvalDataset = {
  id: "demo-dataset",
  name: "Demo QA",
  version: "v1",
  samples: [
    {
      id: "s1",
      query: "公司年假有多少天？",
      expectedAnswer: "15 天",
      expectedChunks: ["c-vacation"],
    },
    {
      id: "s2",
      query: "远程办公政策？",
      expectedAnswer: "每周 3 天",
      expectedChunks: ["c-remote"],
    },
  ],
}

// 假 Pipeline：根据 query 返回对应 Chunk 与答案（模拟一个真实 RAG 系统）
const fakePipeline = async (query: Query): Promise<RAGResponse> => {
  if (query.query.includes("年假")) {
    return {
      answer: "公司年假是 15 天。",
      chunks: [{ id: "c-vacation", content: "公司年假 15 天，每年发放。" }],
    }
  }
  return {
    answer: "远程办公每周 3 天。",
    chunks: [{ id: "c-remote", content: "远程办公政策：每周 3 天。" }],
  }
}

const runner = new Runner({
  metrics: ["recall@5", "mrr", "answer_presence"],
  judges: [new HeuristicJudge()],
})

const result = await runner.run(dataset, fakePipeline)

console.log("=== Eval Run ===")
console.log("Dataset:", result.datasetId, result.datasetVersion)
console.log("Samples:", result.summary.totalSamples)
console.log("\n--- Per-sample scores ---")
for (const r of result.results) {
  console.log(r.sampleId, r.scores)
}
console.log("\n--- Summary (mean) ---")
for (const [name, stats] of Object.entries(result.summary.scores)) {
  console.log(`${name}: mean=${stats.mean.toFixed(2)} min=${stats.min} max=${stats.max}`)
}
