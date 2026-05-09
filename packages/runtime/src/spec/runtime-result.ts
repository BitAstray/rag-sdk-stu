import { z } from "zod"
import { QuerySchema } from "@rag-sdk/core"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"
import { RetrievalCandidateSchema } from "./retrieval-candidate.js"
import {
  PreRetrievalResultSchema,
  RetrievalResultSchema,
  PostRetrievalResultSchema,
  GenerationResultSchema,
} from "./stage-result.js"

export const RuntimeResultSchema = z.object({
  answer: z.string().nullable(),
  candidates: z.array(RetrievalCandidateSchema),
  originalQuery: QuerySchema,
  preprocessed: PreprocessedQuerySchema.nullable(),
  preRetrieval: PreRetrievalResultSchema.nullable(),
  retrieval: RetrievalResultSchema.nullable(),
  postRetrieval: PostRetrievalResultSchema.nullable(),
  generation: GenerationResultSchema.nullable(),
  durationMs: z.number().nonnegative(),
})

export type RuntimeResult = z.infer<typeof RuntimeResultSchema>
