import { createEmitter } from "@rag-sdk/observability"
import type { Emitter, RAGObserver, RuntimeEventName } from "@rag-sdk/observability"

/** Runtime 作用域的发射器：事件名收窄为 RuntimeEventName */
export type RuntimeEmitter = Emitter<RuntimeEventName>

/**
 * 创建绑定 runtime scope 的发射器。
 *
 * 发射协议本身由 observability 的 createEmitter 实现，
 * 这里只负责绑定 scope = "runtime" 并收窄事件名类型。
 */
export function createRuntimeEmitter(
  traceId: string,
  observer?: RAGObserver
): RuntimeEmitter {
  return createEmitter<RuntimeEventName>({ scope: "runtime", traceId, observer })
}
