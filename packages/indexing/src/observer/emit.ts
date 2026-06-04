import { createEmitter } from "@rag-sdk/observability"
import type { Emitter, RAGObserver, IndexingEventName } from "@rag-sdk/observability"
import type { TraceOptions } from "../types/index.js"

/** Indexing 作用域的发射器：事件名收窄为 IndexingEventName */
export type IndexingEmitter = Emitter<IndexingEventName>

/**
 * 创建绑定 indexing scope 的发射器。
 *
 * 发射协议本身由 observability 的 createEmitter 实现，
 * 这里绑定 scope = "indexing"，并把 dataset/version/tags 作为
 * baseAttributes 注入，使其自动出现在每个事件与错误的 attributes 中。
 */
export function createIndexingEmitter(
  traceId: string,
  observer?: RAGObserver,
  trace?: Pick<TraceOptions, "dataset" | "version" | "tags">
): IndexingEmitter {
  return createEmitter<IndexingEventName>({
    scope: "indexing",
    traceId,
    observer,
    baseAttributes: trace
      ? { dataset: trace.dataset, version: trace.version, tags: trace.tags }
      : undefined,
  })
}
