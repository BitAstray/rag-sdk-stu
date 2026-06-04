import type { RAGTrace } from "./trace.js"

/**
 * Trace Exporter 接口
 *
 * 负责将 RAGTrace 输出到特定目标（console、memory、JSONL、HTTP 等）
 */
export interface TraceExporter {
  export(trace: RAGTrace): void | Promise<void>
  flush?(): void | Promise<void>
  shutdown?(): void | Promise<void>
}
