import type { Chunk, Document, Vector } from "@rag-sdk/core"

export interface IndexingResult {
  totalDocuments: number
  totalChunks: number
  errors: Error[]
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
