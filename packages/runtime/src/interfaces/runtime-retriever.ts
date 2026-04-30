import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"
import type { RuntimeContext } from "../types/context.js"

export interface RuntimeRetrieverResult {
  chunks: Chunk[]
  debug?: Record<string, unknown>
}

export interface RuntimeRetriever {
  readonly __runtimeRetriever?: true
  retrieve(
    input: PreprocessedQuery,
    context: RuntimeContext,
  ): Promise<RuntimeRetrieverResult>
}
