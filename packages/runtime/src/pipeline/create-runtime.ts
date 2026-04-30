import type { Query } from "@rag-sdk/core"
import type { RuntimeConfig, Runtime } from "./runtime-types.js"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import { NoopQueryPreprocessor } from "../defaults/noop-query-preprocessor.js"
import { PassthroughRetrievalPostprocessor } from "../defaults/passthrough-postprocessor.js"
import { runRuntime } from "./run-runtime.js"

export function createRuntime(config: RuntimeConfig): Runtime {
  const preprocessor: QueryPreprocessor =
    config.preprocessor ?? new NoopQueryPreprocessor()

  const postprocessor: RetrievalPostprocessor =
    config.postprocessor ?? new PassthroughRetrievalPostprocessor()

  return {
    run: (query: Query) =>
      runRuntime(query, {
        retriever: config.retriever,
        generator: config.generator,
        preprocessor,
        postprocessor,
      }),
  }
}
