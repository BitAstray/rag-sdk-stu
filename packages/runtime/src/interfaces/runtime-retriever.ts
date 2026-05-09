import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RetrievalDebugData } from "../spec/debug.js"

export interface RuntimeRetrieverResult {
  candidates: RetrievalCandidate[]
  debug?: RetrievalDebugData
}

export interface RuntimeRetriever {
  retrieve(input: PreprocessedQuery): Promise<RuntimeRetrieverResult>
}
