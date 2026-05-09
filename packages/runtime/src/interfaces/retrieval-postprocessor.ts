import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"
import type { SelectionTraceItem } from "../spec/selection-trace.js"
import type { AppliedBudget } from "../spec/stage-result.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { PostRetrievalDebugData } from "../spec/debug.js"

export interface SelectionDetail {
  selectedCandidates: RetrievalCandidate[]
  droppedCandidates: RetrievalCandidate[]
  selectionTrace: SelectionTraceItem[]
  appliedScoreThreshold?: number
  appliedBudget?: AppliedBudget
  debug?: PostRetrievalDebugData
}

export interface RetrievalPostprocessorResult {
  candidates: RetrievalCandidate[]
  promptContext: string | null
  detail?: SelectionDetail
}

export interface RetrievalPostprocessor {
  postprocess(
    query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
  ): Promise<RetrievalPostprocessorResult>
}
