import type { z } from "zod"
import type { RAGResponseSchema } from "../spec/rag-response.js"

export type RAGResponse = z.infer<typeof RAGResponseSchema>
