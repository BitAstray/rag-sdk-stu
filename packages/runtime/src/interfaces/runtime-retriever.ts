import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { DebugData } from "../spec/debug.js"

export interface RuntimeRetrieverResult {
  candidates: RetrievalCandidate[]
  debug?: DebugData
}

export interface RuntimeRetriever {
  retrieve(input: PreprocessedQuery): Promise<RuntimeRetrieverResult>
}
