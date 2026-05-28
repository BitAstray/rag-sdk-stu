import type { RAGEventName, RAGEventScope } from "./events.js"
import type { RAGAttributes } from "./json.js"

/**
 * RAG 事件
 *
 * name 使用 <scope>.<stage>.<action> 格式
 * stage 保留为独立字段，便于过滤
 */
export interface RAGEvent {
  traceId: string
  scope: RAGEventScope
  stage: string
  name: RAGEventName
  timestamp: string
  durationMs?: number
  attributes?: RAGAttributes
}
