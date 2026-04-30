import type { Query } from "@rag-sdk/core"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"

export class NoopQueryPreprocessor implements QueryPreprocessor {
  async preprocess(query: Query): Promise<PreprocessedQuery> {
    return {
      originalQuery: query.query,
      effectiveQuery: query.query,
    }
  }
}
