import type { z } from "zod"
import type { PreprocessedQuerySchema } from "../spec/preprocessed-query.js"

export type PreprocessedQuery = z.infer<typeof PreprocessedQuerySchema>
