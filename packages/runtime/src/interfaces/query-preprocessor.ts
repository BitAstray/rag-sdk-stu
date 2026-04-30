import type { Query } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"

export interface QueryPreprocessor {
  preprocess(query: Query): Promise<PreprocessedQuery>
}
