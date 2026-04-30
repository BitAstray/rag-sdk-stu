import type { Chunk } from "@rag-sdk/core"
import type {
  RetrievalPostprocessor,
  RetrievalPostprocessorResult,
} from "../interfaces/retrieval-postprocessor.js"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"
import type { RuntimeContext } from "../types/context.js"

export class PassthroughRetrievalPostprocessor implements RetrievalPostprocessor {
  async postprocess(
    _query: PreprocessedQuery,
    chunks: Chunk[],
    _context: RuntimeContext,
  ): Promise<RetrievalPostprocessorResult> {
    return {
      chunks,
      promptContext: null,
    }
  }
}
