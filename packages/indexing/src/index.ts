// Types
export type {
  IndexingResult,
  IndexingContext,
  IndexingOptions,
  Loader,
  DocumentTransformer,
  Chunker,
  Embedder,
  VectorStore,
} from "./types/index.js"

export type { Vector } from "./embedders/types.js"

// Errors
export { IndexingError } from "./types/errors.js"

// Default components
export { SimpleChunker } from "./chunkers/simple-chunker.js"
export { MockEmbedder } from "./embedders/mock-embedder.js"
export { MemoryVectorStore } from "./stores/memory-vector-store.js"
export { MarkdownLoader } from "./loaders/markdown-loader.js"
export type { FileSystem } from "./loaders/markdown-loader.js"

// Pipeline
export { IndexingStream, PipelineSteps } from "./pipeline/pipeline.js"
export type { Transform } from "./pipeline/pipeline.js"

// Defaults
export {
  DEFAULT_CHUNK_SIZE,
  DEFAULT_OVERLAP,
  DEFAULT_BATCH_SIZE,
  DEFAULT_VECTOR_DIMENSION,
} from "./defaults/index.js"
