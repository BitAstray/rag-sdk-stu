import type {
  RetrievalPostprocessor,
  RetrievalPostprocessorResult,
} from "../interfaces/retrieval-postprocessor.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

export class PassthroughRetrievalPostprocessor implements RetrievalPostprocessor {
  async postprocess(
    _query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
  ): Promise<RetrievalPostprocessorResult> {
    return {
      candidates,
      promptContext: null,
    }
  }
}
