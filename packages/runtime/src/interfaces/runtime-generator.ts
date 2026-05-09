import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { GenerationDebugData } from "../spec/debug.js"

export interface RuntimeGeneratorResult {
  answer: string | null
  debug?: GenerationDebugData
}

export interface RuntimeGenerator {
  generate(
    query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
    promptContext: string | null,
  ): Promise<RuntimeGeneratorResult>
}
