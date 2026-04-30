import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RuntimeContext } from "../spec/context.js"
import type { RetrievalDebugData } from "../spec/debug.js"

export interface RuntimeRetrieverResult {
  chunks: Chunk[]
  debug?: RetrievalDebugData
}

export interface RuntimeRetriever {
  retrieve(
    input: PreprocessedQuery,
    context: RuntimeContext,
  ): Promise<RuntimeRetrieverResult>
}
