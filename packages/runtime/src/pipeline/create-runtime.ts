import type { Retriever, Generator, Query } from "@rag-sdk/core"
import type { RuntimeConfig, Runtime } from "./runtime-types.js"
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js"
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import { CoreRetrieverWrapper } from "../defaults/retriever-wrapper.js"
import { CoreGeneratorWrapper } from "../defaults/generator-wrapper.js"
import { NoopQueryPreprocessor } from "../defaults/noop-query-preprocessor.js"
import { PassthroughRetrievalPostprocessor } from "../defaults/passthrough-postprocessor.js"
import { runRuntime } from "./run-runtime.js"

function isRuntimeRetriever(r: Retriever | RuntimeRetriever): r is RuntimeRetriever {
  return "__runtimeRetriever" in r
}

function isRuntimeGenerator(g: Generator | RuntimeGenerator): g is RuntimeGenerator {
  return "__runtimeGenerator" in g
}

export function createRuntime(config: RuntimeConfig): Runtime {
  const runtimeRetriever: RuntimeRetriever = isRuntimeRetriever(config.retriever)
    ? config.retriever
    : new CoreRetrieverWrapper(config.retriever as Retriever)

  const runtimeGenerator: RuntimeGenerator = isRuntimeGenerator(config.generator)
    ? config.generator
    : new CoreGeneratorWrapper(config.generator as Generator)

  const preprocessor: QueryPreprocessor =
    config.preprocessor ?? new NoopQueryPreprocessor()

  const postprocessor: RetrievalPostprocessor =
    config.postprocessor ?? new PassthroughRetrievalPostprocessor()

  return {
    run: (query: Query) =>
      runRuntime(query, {
        retriever: runtimeRetriever,
        generator: runtimeGenerator,
        preprocessor,
        postprocessor,
      }),
  }
}
