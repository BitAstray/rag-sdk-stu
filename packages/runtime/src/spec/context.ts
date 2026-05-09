import { z } from "zod"
import type { Query } from "@rag-sdk/core"
import { QuerySchema } from "@rag-sdk/core"
import type { PreprocessedQuery } from "./preprocessed-query.js"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"
import type { RetrievalCandidate } from "./retrieval-candidate.js"
import { RetrievalCandidateSchema } from "./retrieval-candidate.js"
import type { RuntimeMetadata } from "./debug.js"

export const RuntimeContextSchema = z.object({
  originalQuery: QuerySchema,
  preprocessed: PreprocessedQuerySchema.nullable(),
  candidates: z.array(RetrievalCandidateSchema),
  promptContext: z.string().nullable(),
  metadata: z.record(z.unknown()),
})

export interface RuntimeContext {
  originalQuery: Query
  preprocessed: PreprocessedQuery | null
  candidates: RetrievalCandidate[]
  promptContext: string | null
  metadata: RuntimeMetadata
}
