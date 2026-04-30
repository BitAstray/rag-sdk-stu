import { z } from "zod"
import { ChunkSchema } from "@rag-sdk/core"

export const PreRetrievalResultSchema = z.object({
  originalQuery: z.string(),
  effectiveQuery: z.string(),
  topK: z.number().int().positive().optional(),
  filters: z.record(z.unknown()).optional(),
  strategy: z.string().optional(),
  route: z.string().optional(),
  rewriteReason: z.string().optional(),
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
