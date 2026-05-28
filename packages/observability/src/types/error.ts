import type { RAGEventName, RAGEventScope } from "./events.js"
import type { RAGAttributes } from "./json.js"

/**
 * RAG 错误记录
 *
 * ErrorRecord 中不要保存 Error 原对象
 * cause 如果需要记录，应转换为 JSON-safe 摘要
 * stack 是否输出应受环境与 redaction 策略控制
 */
export interface RAGErrorRecord {
  traceId: string
  scope: RAGEventScope
  stage: string
  name: RAGEventName
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  attributes?: RAGAttributes
}
