import type { Query } from "@rag-sdk/core"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js"
import type { RuntimeResult } from "../spec/runtime-result.js"

export interface RuntimeConfig {
  retriever: RuntimeRetriever
  generator: RuntimeGenerator
  preprocessor?: QueryPreprocessor
  postprocessor?: RetrievalPostprocessor
}

export interface Runtime {
  run(query: Query): Promise<RuntimeResult>
}
