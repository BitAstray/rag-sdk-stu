import { z } from "zod"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"
import { RetrievalCandidateSchema } from "./retrieval-candidate.js"
import { SelectionTraceItemSchema } from "./selection-trace.js"

export const AppliedBudgetSchema = z.object({
  maxCandidates: z.number().int().positive().optional(),
  maxPromptChars: z.number().int().positive().optional(),
})

export const PreRetrievalResultSchema = PreprocessedQuerySchema.extend({
  durationMs: z.number().nonnegative(),
})

export const RetrievalResultSchema = z.object({
  candidates: z.array(RetrievalCandidateSchema),
  retrievedCount: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
})

export const PostRetrievalResultSchema = z.object({
  candidates: z.array(RetrievalCandidateSchema),
  promptContext: z.string().nullable(),
  selectedCandidates: z.array(RetrievalCandidateSchema),
  droppedCandidates: z.array(RetrievalCandidateSchema),
  selectionTrace: z.array(SelectionTraceItemSchema),
  appliedScoreThreshold: z.number().optional(),
  appliedBudget: AppliedBudgetSchema.optional(),
  removedCount: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
})

export const GenerationResultSchema = z.object({
  answer: z.string().nullable(),
  durationMs: z.number().nonnegative(),
})

export type AppliedBudget = z.infer<typeof AppliedBudgetSchema>
export type PreRetrievalResult = z.infer<typeof PreRetrievalResultSchema>
export type RetrievalResult = z.infer<typeof RetrievalResultSchema>
export type PostRetrievalResult = z.infer<typeof PostRetrievalResultSchema>
export type GenerationResult = z.infer<typeof GenerationResultSchema>
