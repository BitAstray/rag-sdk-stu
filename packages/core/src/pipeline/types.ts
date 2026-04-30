import type { Query } from "../types/query.js"
import type { RAGResponse } from "../types/rag-response.js"

export type RAGPipeline = (query: Query) => Promise<RAGResponse>
