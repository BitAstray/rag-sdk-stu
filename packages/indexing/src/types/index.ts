import type { Chunk, Document, Vector } from "@rag-sdk/core"
import type { RAGObserver } from "@rag-sdk/observability"

export interface IndexingResult {
  totalDocuments: number
  totalChunks: number
  errors: Error[]
  traceId?: string
}

export interface IndexingContext {
  documentIndex: number
  totalDocuments: number
}

/**
 * 链路追踪选项
 *
 * 贯穿 indexing 管线的追踪元数据。dataset/version/tags 会作为
 * baseAttributes 注入到每个 observer 事件与错误中。
 */
export interface TraceOptions {
  traceId?: string
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
}

export interface IndexingOptions {
  loader: Loader
  chunker?: Chunker
  embedder: Embedder
  store: VectorStore
  transformer?: DocumentTransformer
  shouldIndex?: (doc: Document, context: IndexingContext) => boolean
  metadataBuilder?: (doc: Document, chunk: Chunk, context: IndexingContext) => Record<string, string | number | boolean | string[] | null>
  onError?: (error: Error, doc: Document | undefined, context: IndexingContext) => void
  observer?: RAGObserver
  trace?: TraceOptions
}

export interface Loader {
  load(): Promise<Document[]>
}

export interface DocumentTransformer {
  transform(doc: Document): Promise<Document>
}

export interface Chunker {
  chunk(doc: Document): Promise<Chunk[]>
}

export interface Embedder {
  embed(chunks: Chunk[]): Promise<Vector[]>
}

export interface VectorStore {
  upsert(vectors: Vector[]): Promise<void>
}
