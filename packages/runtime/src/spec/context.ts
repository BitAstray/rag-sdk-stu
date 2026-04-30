import { z } from "zod"
import { ChunkSchema, QuerySchema } from "@rag-sdk/core"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"

export const RuntimeContextSchema = z.object({
  originalQuery: QuerySchema,
  preprocessed: PreprocessedQuerySchema.nullable(),
  chunks: z.array(ChunkSchema),
  promptContext: z.string().nullable(),
  metadata: z.record(z.unknown()),
})
