import type { RAGEvent } from "./event.js"
import type { RAGErrorRecord } from "./error.js"
import type { RAGTrace } from "./trace.js"

export interface TraceHandle {
  end: (status: "ok" | "error") => void
}

/**
 * RAG Observer 接口
 *
 * 所有方法都是可选的，失败不应中断主流程
 * 异步方法采用 fire-and-forget 模式，不阻塞调用方
 *
 * 生命周期：
 * - flush() 由 runtime/indexing 在流程结束时自动调用
 * - shutdown() 由调用方负责调用，用于释放资源
 */
export interface RAGObserver {
  startTrace?(traceId: string, scope: "runtime" | "indexing" | "eval"): TraceHandle
  onEvent?(event: RAGEvent): void | Promise<void>
  onError?(error: RAGErrorRecord): void | Promise<void>
  onTraceEnd?(trace: RAGTrace): void | Promise<void>
  flush?(): void | Promise<void>
  shutdown?(): void | Promise<void>
}
