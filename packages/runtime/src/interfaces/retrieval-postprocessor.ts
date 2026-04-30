import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"
import type { RuntimeContext } from "../types/context.js"

export interface RetrievalPostprocessorResult {
  chunks: Chunk[]
  promptContext: string | null
  debug?: Record<string, unknown>
}

export interface RetrievalPostprocessor {
  postprocess(
    query: PreprocessedQuery,
    chunks: Chunk[],
    context: RuntimeContext,
  ): Promise<RetrievalPostprocessorResult>
}
