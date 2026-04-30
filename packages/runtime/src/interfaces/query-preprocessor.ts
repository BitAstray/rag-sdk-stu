import type { Query } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"

export interface QueryPreprocessor {
  preprocess(query: Query): Promise<PreprocessedQuery>
}
