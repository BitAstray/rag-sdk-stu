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
  trace?: {
    traceId?: string
    dataset?: string
    version?: string
    tags?: Record<string, string | number | boolean>
  }
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
