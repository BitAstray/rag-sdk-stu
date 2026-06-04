import type { Chunk, RAGResponse } from "@rag-sdk/core"
import type { EvalSample } from "../types/dataset.js"

/**
 * 评估指标
 *
 * 一个 Metric 在单个样本上比较 Pipeline 输出与期望结果，产出 [0, 1] 的分数。
 * name 是稳定的标识，供 EvalConfig.metrics 按名引用。
 */
export interface Metric {
  readonly name: string
  evaluate(sample: EvalSample, output: RAGResponse): number
}

function expectedChunkIds(sample: EvalSample): string[] {
  return sample.expectedChunks ?? []
}

function retrievedIds(output: RAGResponse): string[] {
  return output.chunks.map((c: Chunk) => c.id)
}

/**
 * Recall@K
 *
 * 期望 Chunk 中被检索回来的比例。没有期望 Chunk 时记为 1（无可召回项）。
 */
export class RecallAtK implements Metric {
  readonly name: string
  constructor(private readonly k: number = Infinity) {
    this.name = Number.isFinite(k) ? `recall@${k}` : "recall"
  }

  evaluate(sample: EvalSample, output: RAGResponse): number {
    const expected = expectedChunkIds(sample)
    if (expected.length === 0) return 1
    const retrieved = new Set(retrievedIds(output).slice(0, this.k))
    const hit = expected.filter((id) => retrieved.has(id)).length
    return hit / expected.length
  }
}

/**
 * MRR（Mean Reciprocal Rank）
 *
 * 第一个命中的期望 Chunk 的排名倒数。没有命中记为 0，没有期望 Chunk 记为 1。
 */
export class ReciprocalRank implements Metric {
  readonly name = "mrr"

  evaluate(sample: EvalSample, output: RAGResponse): number {
    const expected = new Set(expectedChunkIds(sample))
    if (expected.size === 0) return 1
    const retrieved = retrievedIds(output)
    for (let i = 0; i < retrieved.length; i++) {
      if (expected.has(retrieved[i])) return 1 / (i + 1)
    }
    return 0
  }
}

/**
 * AnswerPresence
 *
 * 期望答案文本是否（子串、忽略大小写）出现在生成答案中。没有期望答案记为 1。
 */
export class AnswerPresence implements Metric {
  readonly name = "answer_presence"

  evaluate(sample: EvalSample, output: RAGResponse): number {
    if (!sample.expectedAnswer) return 1
    return output.answer.toLowerCase().includes(sample.expectedAnswer.toLowerCase())
      ? 1
      : 0
  }
}

/**
 * 内置指标注册表，按 name 索引。EvalConfig.metrics 引用这些 name。
 */
export function defaultMetrics(): Metric[] {
  return [new RecallAtK(5), new ReciprocalRank(), new AnswerPresence()]
}

/**
 * 按名解析指标。未知 name 抛错，避免静默漏算。
 */
export function resolveMetrics(names: string[], registry: Metric[] = defaultMetrics()): Metric[] {
  const byName = new Map(registry.map((m) => [m.name, m]))
  return names.map((name) => {
    const metric = byName.get(name)
    if (!metric) {
      throw new Error(`Unknown metric: "${name}". Available: ${[...byName.keys()].join(", ")}`)
    }
    return metric
  })
}
