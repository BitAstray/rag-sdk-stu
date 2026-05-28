import type { Retriever, Generator } from "@rag-sdk/core"
import type { RAGObserver } from "@rag-sdk/observability"
import type { Runtime } from "../pipeline/create-runtime.js"
import { createRuntime } from "../pipeline/create-runtime.js"
import { CoreRetrieverWrapper } from "./retriever-wrapper.js"
import { CoreGeneratorWrapper } from "./generator-wrapper.js"
import { NoopQueryPreprocessor } from "./noop-query-preprocessor.js"
import { PassthroughRetrievalPostprocessor } from "./passthrough-postprocessor.js"

export interface CreateDefaultRuntimeConfig {
  retriever: Retriever
  generator: Generator
  observer?: RAGObserver
}

export function createDefaultRuntime(config: CreateDefaultRuntimeConfig): Runtime {
  const preprocessor = new NoopQueryPreprocessor()
  const retriever = new CoreRetrieverWrapper(config.retriever)
  const postprocessor = new PassthroughRetrievalPostprocessor()
  const generator = new CoreGeneratorWrapper(config.generator)

  return createRuntime({
    observer: config.observer,
    nodes: [
      {
        id: "preprocessor",
        dependencies: ["query"],
        execute: async (inputs: Record<string, any>) => {
          return preprocessor.preprocess(inputs.query)
        }
      },
      {
        id: "retriever",
        dependencies: ["preprocessor"],
        execute: async (inputs: Record<string, any>) => {
          return retriever.retrieve(inputs.preprocessor)
        }
      },
      {
        id: "postprocessor",
        dependencies: ["preprocessor", "retriever"],
        execute: async (inputs: Record<string, any>) => {
          return postprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates)
        }
      },
      {
        id: "generator",
        dependencies: ["preprocessor", "postprocessor"],
        execute: async (inputs: Record<string, any>) => {
          return generator.generate(inputs.preprocessor, inputs.postprocessor.candidates, inputs.postprocessor.promptContext)
        }
      }
    ]
  })
}
