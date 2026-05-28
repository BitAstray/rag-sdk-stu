import type { RAGEvent } from "./event.js"
import type { RAGEventScope } from "./events.js"
import type { RAGErrorRecord } from "./error.js"
import type { RAGMetric } from "./metric.js"

/**
 * Trace 上下文（创建时输入）
 */
export interface TraceContext {
  traceId: string
  traceIdSource?: "generated" | "provided" | "requestId"
  requestId?: string
  serviceName?: string
  environment?: string
  sampleId?: string
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
}

/**
 * RAG Trace（最终输出）
 *
 * TraceContext 是创建时输入，RAGTrace 是最终输出，字段重复是刻意设计
 */
export interface RAGTrace {
  traceId: string
  traceIdSource?: "generated" | "provided" | "requestId"
  requestId?: string
  scope: RAGEventScope
  serviceName?: string
  environment?: string
  sampleId?: string
  dataset?: string
  version?: string
  startedAt: string
  endedAt?: string
  durationMs?: number
  status: "ok" | "error"
  tags?: Record<string, string | number | boolean>
  events: RAGEvent[]
  errors?: RAGErrorRecord[]
  metrics?: RAGMetric[]
}
