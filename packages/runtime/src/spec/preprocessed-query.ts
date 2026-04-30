import { z } from "zod"

export const PreprocessedQuerySchema = z.object({
  originalQuery: z.string().min(1),
  effectiveQuery: z.string().min(1),
  topK: z.number().int().positive().optional(),
  filters: z.record(z.unknown()).optional(),
  strategy: z.string().optional(),
  route: z.string().optional(),
  rewriteReason: z.string().optional(),
})
