import { z } from "zod"
import { ChunkSchema } from "@rag-sdk/core"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"

export const PreRetrievalResultSchema = PreprocessedQuerySchema.extend({
  durationMs: z.number().nonnegative(),
})

export const RetrievalResultSchema = z.object({
  chunks: z.array(ChunkSchema),
  retrievedCount: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
})

export const PostRetrievalResultSchema = z.object({
  chunks: z.array(ChunkSchema),
  promptContext: z.string().nullable(),
  removedCount: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
})

export const GenerationResultSchema = z.object({
  answer: z.string().nullable(),
  durationMs: z.number().nonnegative(),
})

export type PreRetrievalResult = z.infer<typeof PreRetrievalResultSchema>
export type RetrievalResult = z.infer<typeof RetrievalResultSchema>
export type PostRetrievalResult = z.infer<typeof PostRetrievalResultSchema>
export type GenerationResult = z.infer<typeof GenerationResultSchema>
