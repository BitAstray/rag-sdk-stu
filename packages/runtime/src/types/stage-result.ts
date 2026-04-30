import type { z } from "zod"
import type {
  PreRetrievalResultSchema,
  RetrievalResultSchema,
  PostRetrievalResultSchema,
  GenerationResultSchema,
} from "../spec/stage-result.js"

export type PreRetrievalResult = z.infer<typeof PreRetrievalResultSchema>
export type RetrievalResult = z.infer<typeof RetrievalResultSchema>
export type PostRetrievalResult = z.infer<typeof PostRetrievalResultSchema>
export type GenerationResult = z.infer<typeof GenerationResultSchema>
