import type { Query } from "../spec/query.js"
import type { RAGResponse } from "../spec/rag-response.js"

export type RAGPipeline = (query: Query) => Promise<RAGResponse>
