import { createTimestamp } from "@rag-sdk/utils"
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGObserver } from "../types/observer.js"
import type { RAGEventName, RAGEventScope } from "../types/events.js"
import type { RAGAttributes } from "../types/json.js"

/**
 * Emitter 配置
 *
 * scope 与 baseAttributes 在创建时一次性绑定，
 * 之后每次发射都会自动带上 scope，并把 baseAttributes 合并进 attributes。
 */
export interface EmitterOptions {
  scope: RAGEventScope
  traceId: string
  observer?: RAGObserver
  /** 每个事件/错误都会合并进 attributes 的基础属性（如 dataset、version、tags） */
  baseAttributes?: Record<string, unknown>
}

/**
 * 事件发射器
 *
 * 单一的发射协议实现，runtime / indexing 通过绑定不同的 scope 与 baseAttributes 复用。
 * 所有方法在没有 observer（或对应回调）时安全地静默返回，不影响主流程。
 */
export interface Emitter<TName extends RAGEventName = RAGEventName> {
  readonly traceId: string
  readonly observer?: RAGObserver
  event(
    stage: string,
    name: TName,
    attributes?: Record<string, unknown>,
    durationMs?: number
  ): void
  error(
    stage: string,
    name: TName,
    error: Error,
    attributes?: Record<string, unknown>
  ): void
}

function mergeAttributes(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown> | undefined
): RAGAttributes | undefined {
  if (!base) return extra as RAGAttributes | undefined
  return { ...base, ...extra } as RAGAttributes
}

/**
 * 创建一个绑定了 scope 的发射器。
 *
 * 这是发射协议的唯一实现点：RAGEvent / RAGErrorRecord 的组装、observer 的可选守卫、
 * 时间戳与 baseAttributes 合并都集中在这里。
 */
export function createEmitter<TName extends RAGEventName = RAGEventName>(
  options: EmitterOptions
): Emitter<TName> {
  const { scope, traceId, observer, baseAttributes } = options

  return {
    traceId,
    observer,

    event(stage, name, attributes, durationMs) {
      if (!observer?.onEvent) return
      const event: RAGEvent = {
        traceId,
        scope,
        stage,
        name,
        timestamp: createTimestamp(),
        durationMs,
        attributes: mergeAttributes(baseAttributes, attributes),
      }
      observer.onEvent(event)
    },

    error(stage, name, error, attributes) {
      if (!observer?.onError) return
      const record: RAGErrorRecord = {
        traceId,
        scope,
        stage,
        name,
        timestamp: createTimestamp(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        attributes: mergeAttributes(baseAttributes, attributes),
      }
      observer.onError(record)
    },
  }
}
