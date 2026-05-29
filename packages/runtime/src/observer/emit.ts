import type { RAGObserver, RAGEvent, RAGErrorRecord, RuntimeEventName } from "@rag-sdk/observability"
import { createTimestamp } from "@rag-sdk/utils"

/**
 * 事件发射上下文
 */
export interface EmitContext {
  traceId: string
  observer?: RAGObserver
}

/**
 * 发射事件
 */
export function emitEvent(
  ctx: EmitContext,
  stage: string,
  name: RuntimeEventName,
  attributes?: Record<string, unknown>,
  durationMs?: number
): void {
  if (!ctx.observer?.onEvent) return

  const event: RAGEvent = {
    traceId: ctx.traceId,
    scope: "runtime",
    stage,
    name,
    timestamp: createTimestamp(),
    durationMs,
    attributes: attributes as any,
  }

  ctx.observer.onEvent(event)
}

/**
 * 发射错误
 */
export function emitError(
  ctx: EmitContext,
  stage: string,
  name: RuntimeEventName,
  error: Error,
  attributes?: Record<string, unknown>
): void {
  if (!ctx.observer?.onError) return

  const errorRecord: RAGErrorRecord = {
    traceId: ctx.traceId,
    scope: "runtime",
    stage,
    name,
    timestamp: createTimestamp(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    attributes: attributes as any,
  }

  ctx.observer.onError(errorRecord)
}

/**
 * 创建 EmitContext
 */
export function createEmitContext(
  traceId: string,
  observer?: RAGObserver
): EmitContext {
  return { traceId, observer }
}
