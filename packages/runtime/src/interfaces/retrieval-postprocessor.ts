import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RuntimeContext } from "../spec/context.js"
import type { PostRetrievalDebugData } from "../spec/debug.js"

export interface RetrievalPostprocessorResult {
  chunks: Chunk[]
  promptContext: string | null
  debug?: PostRetrievalDebugData
}

export interface RetrievalPostprocessor {
  postprocess(
    query: PreprocessedQuery,
    chunks: Chunk[],
    context: RuntimeContext,
  ): Promise<RetrievalPostprocessorResult>
}
