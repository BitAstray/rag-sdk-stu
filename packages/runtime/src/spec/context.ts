import { z } from "zod"
import type { Query, Chunk } from "@rag-sdk/core"
import { ChunkSchema, QuerySchema } from "@rag-sdk/core"
import type { PreprocessedQuery } from "./preprocessed-query.js"
import { PreprocessedQuerySchema } from "./preprocessed-query.js"
import type { RuntimeMetadata } from "./debug.js"

export const RuntimeContextSchema = z.object({
  originalQuery: QuerySchema,
  preprocessed: PreprocessedQuerySchema.nullable(),
  chunks: z.array(ChunkSchema),
  promptContext: z.string().nullable(),
  metadata: z.record(z.unknown()),
})

export interface RuntimeContext {
  originalQuery: Query
  preprocessed: PreprocessedQuery | null
  chunks: Chunk[]
  promptContext: string | null
  metadata: RuntimeMetadata
}
