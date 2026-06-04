import type { RAGTrace, RAGEvent } from "@rag-sdk/observability"
import type {
  TraceEvalSample,
  TraceCandidate,
  TraceQualitySignals,
} from "../types/trace-link.js"

/**
 * Trace 提取
 *
 * 把 observability 的 RAGTrace 转成 eval 可消费的样本与质量信号。
 * 这是 eval → observability 依赖的落地点：eval 不重跑 Pipeline，
 * 而是从已记录的 trace 中提取评估所需信息。
 */

const LOW_CONFIDENCE_THRESHOLD = 0.5
const HIGH_DROP_RATE_THRESHOLD = 0.5

function findEvent(trace: RAGTrace, name: string): RAGEvent | undefined {
  return trace.events.find((e) => e.name === name)
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}

/**
 * 从 trace 计算质量信号，用于挑出需要关注的 trace。
 */
export function extractQualitySignals(trace: RAGTrace): TraceQualitySignals {
  const retrieval = findEvent(trace, "runtime.retrieval.complete")
  const postRetrieval = findEvent(trace, "runtime.post_retrieval.select")

  const candidateCount = num(retrieval?.attributes?.candidateCount) ?? 0
  const selectedCount = num(postRetrieval?.attributes?.selectedCount) ?? candidateCount
  const droppedCount = num(postRetrieval?.attributes?.droppedCount) ?? 0
  const total = selectedCount + droppedCount

  const topScore = num(retrieval?.attributes?.topScore)

  return {
    emptyRetrieval: candidateCount === 0,
    lowConfidence: topScore !== undefined && topScore < LOW_CONFIDENCE_THRESHOLD,
    highDropRate: total > 0 && droppedCount / total > HIGH_DROP_RATE_THRESHOLD,
    errorOccurred: trace.status === "error" || (trace.errors?.length ?? 0) > 0,
  }
}

/**
 * 从 trace 提取 eval 样本。query/answer/candidates 取自对应阶段事件。
 */
export function extractEvalSample(trace: RAGTrace): TraceEvalSample {
  const query = findEvent(trace, "runtime.query.receive")
  const generation = findEvent(trace, "runtime.generation.complete")
  const signals = extractQualitySignals(trace)

  const candidates: TraceCandidate[] = []
  const candidateList = query && Array.isArray(query.attributes?.candidates)
    ? (query.attributes?.candidates as unknown[])
    : []
  for (const raw of candidateList) {
    if (raw && typeof raw === "object" && "id" in raw) {
      const c = raw as Record<string, unknown>
      candidates.push({
        id: String(c.id),
        score: num(c.score),
        sourceId: typeof c.sourceId === "string" ? c.sourceId : undefined,
        selected: c.selected === true,
        dropReason: typeof c.dropReason === "string" ? c.dropReason : undefined,
      })
    }
  }

  return {
    traceId: trace.traceId,
    sampleId: trace.sampleId,
    dataset: trace.dataset,
    version: trace.version,
    query: typeof query?.attributes?.query === "string" ? query.attributes.query : "",
    answer: typeof generation?.attributes?.answer === "string" ? generation.attributes.answer : undefined,
    candidates,
    emptyRetrieval: signals.emptyRetrieval,
    lowConfidence: signals.lowConfidence,
  }
}
