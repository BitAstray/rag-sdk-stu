import type { RAGResponse } from "@rag-sdk/core"
import type { EvalSample } from "../types/dataset.js"

/**
 * 评判器
 *
 * Judge 对单个样本的 Pipeline 输出做质量评判，产出一组命名分数（[0, 1]）。
 * 与 Metric 的区别：Metric 是确定性的逐项比较；Judge 可承载更主观/聚合的评判
 * （如忠实度、相关性），实现可以是启发式或调用 LLM。
 */
export interface Judge {
  readonly name: string
  judge(sample: EvalSample, output: RAGResponse): Promise<Record<string, number>> | Record<string, number>
}

/**
 * 启发式评判器
 *
 * 不依赖外部 LLM 的基线评判：
 * - faithfulness：答案是否非空且有引用 Chunk 支撑
 * - groundedness：引用 Chunk 内容与答案的词重叠比例
 *
 * 用于在没有 LLM judge 时提供可运行的默认评判，并作为 Judge 接口的参考实现。
 */
export class HeuristicJudge implements Judge {
  readonly name = "heuristic"

  judge(_sample: EvalSample, output: RAGResponse): Record<string, number> {
    const hasAnswer = output.answer.trim().length > 0
    const hasChunks = output.chunks.length > 0

    const faithfulness = hasAnswer && hasChunks ? 1 : 0
    const groundedness = hasAnswer ? overlapRatio(output) : 0

    return { faithfulness, groundedness }
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9一-鿿]+/)
      .filter((t) => t.length > 0)
  )
}

/** 答案 token 中能在任一引用 Chunk 里找到的比例。 */
function overlapRatio(output: RAGResponse): number {
  const answerTokens = tokenize(output.answer)
  if (answerTokens.size === 0) return 0

  const contextTokens = new Set<string>()
  for (const chunk of output.chunks) {
    for (const t of tokenize(chunk.content)) contextTokens.add(t)
  }
  if (contextTokens.size === 0) return 0

  let grounded = 0
  for (const t of answerTokens) {
    if (contextTokens.has(t)) grounded++
  }
  return grounded / answerTokens.size
}
