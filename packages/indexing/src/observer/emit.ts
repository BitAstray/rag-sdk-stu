import type { RAGObserver, RAGEvent, RAGErrorRecord, IndexingEventName } from "@rag-sdk/observability"
import { createTimestamp } from "@rag-sdk/utils"

/**
 * 事件发射上下文
 */
export interface EmitContext {
  traceId: string
  observer?: RAGObserver
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
}

/**
 * 发射事件
 */
export function emitEvent(
  ctx: EmitContext,
  stage: string,
  name: IndexingEventName,
  attributes?: Record<string, unknown>,
  durationMs?: number
): void {
  if (!ctx.observer?.onEvent) return

  const event: RAGEvent = {
    traceId: ctx.traceId,
    scope: "indexing",
    stage,
    name,
    timestamp: createTimestamp(),
    durationMs,
    attributes: {
      dataset: ctx.dataset,
      version: ctx.version,
      tags: ctx.tags,
      ...attributes,
    } as any,
  }

  ctx.observer.onEvent(event)
}

/**
 * 发射错误
 */
export function emitError(
  ctx: EmitContext,
  stage: string,
  name: IndexingEventName,
  error: Error,
  attributes?: Record<string, unknown>
): void {
  if (!ctx.observer?.onError) return

  const errorRecord: RAGErrorRecord = {
    traceId: ctx.traceId,
    scope: "indexing",
    stage,
    name,
    timestamp: createTimestamp(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    attributes: {
      dataset: ctx.dataset,
      version: ctx.version,
      tags: ctx.tags,
      ...attributes,
    } as any,
  }

  ctx.observer.onError(errorRecord)
}

/**
 * 创建 EmitContext
 */
export function createEmitContext(
  traceId: string,
  observer?: RAGObserver,
  options?: {
    dataset?: string
    version?: string
    tags?: Record<string, string | number | boolean>
  }
): EmitContext {
  return {
    traceId,
    observer,
    dataset: options?.dataset,
    version: options?.version,
    tags: options?.tags,
  }
}
