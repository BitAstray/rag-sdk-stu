/**
 * RAG 事件作用域
 */
export type RAGEventScope = "runtime" | "indexing"

/**
 * RAG 事件动作
 */
export type RAGEventAction =
  | "receive"
  | "preprocess"
  | "start"
  | "complete"
  | "fail"
  | "select"
  | "drop"
  | "store"

/**
 * Runtime 事件名
 */
export type RuntimeEventName =
  | "runtime.query.receive"
  | "runtime.query.preprocess"
  | "runtime.retrieval.start"
  | "runtime.retrieval.complete"
  | "runtime.retrieval.fail"
  | "runtime.post_retrieval.start"
  | "runtime.post_retrieval.select"
  | "runtime.post_retrieval.fail"
  | "runtime.generation.start"
  | "runtime.generation.complete"
  | "runtime.generation.fail"
  | "runtime.run.complete"
  | "runtime.run.fail"

/**
 * Indexing 事件名
 */
export type IndexingEventName =
  | "indexing.run.start"
  | "indexing.run.complete"
  | "indexing.run.fail"
  | "indexing.load.start"
  | "indexing.load.complete"
  | "indexing.load.fail"
  | "indexing.transform.complete"
  | "indexing.filter.complete"
  | "indexing.chunk.complete"
  | "indexing.transform_chunk.complete"
  | "indexing.metadata.complete"
  | "indexing.extract_metadata.complete"
  | "indexing.filter_chunk.complete"
  | "indexing.embed.complete"
  | "indexing.store.complete"

/**
 * RAG 事件名（联合类型）
 */
export type RAGEventName = RuntimeEventName | IndexingEventName
