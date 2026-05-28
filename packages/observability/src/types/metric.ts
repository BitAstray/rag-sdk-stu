import type { RAGEventScope } from "./events.js"
import type { RAGAttributes } from "./json.js"

/**
 * RAG 指标
 */
export interface RAGMetric {
  traceId: string
  name: string
  value: number
  unit?: "ms" | "count" | "tokens" | "ratio" | "bytes"
  scope?: RAGEventScope
  stage?: string
  attributes?: RAGAttributes
}
