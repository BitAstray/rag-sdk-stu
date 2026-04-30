import type { Retriever, Generator, Query } from "@rag-sdk/core"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js"
import type { RuntimeResult } from "../types/runtime-result.js"

export interface RuntimeConfig {
  retriever: Retriever | RuntimeRetriever
  generator: Generator | RuntimeGenerator
  preprocessor?: QueryPreprocessor
  postprocessor?: RetrievalPostprocessor
}

export interface Runtime {
  run(query: Query): Promise<RuntimeResult>
}
