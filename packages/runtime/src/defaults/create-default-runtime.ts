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
        telemetry: {
          stage: "query",
          events: {
            start: "runtime.query.receive",
            complete: "runtime.query.preprocess",
            fail: "runtime.run.fail"
          }
        },
        execute: async (inputs: Record<string, any>) => {
          return preprocessor.preprocess(inputs.query)
        }
      },
      {
        id: "retriever",
        dependencies: ["preprocessor"],
        telemetry: {
          stage: "retrieval",
          events: {
            start: "runtime.retrieval.start",
            complete: "runtime.retrieval.complete",
            fail: "runtime.retrieval.fail"
          },
          extractMetrics: (output: any) => ({
            candidateCount: output.candidates?.length ?? 0,
            retrievedCount: output.retrievedCount
          })
        },
        execute: async (inputs: Record<string, any>) => {
          return retriever.retrieve(inputs.preprocessor)
        }
      },
      {
        id: "postprocessor",
        dependencies: ["preprocessor", "retriever"],
        telemetry: {
          stage: "post_retrieval",
          events: {
            start: "runtime.post_retrieval.start",
            complete: "runtime.post_retrieval.select",
            fail: "runtime.post_retrieval.fail"
          },
          extractMetrics: (output: any) => ({
            selectedCount: output.selectedCandidates?.length ?? 0,
            droppedCount: output.droppedCandidates?.length ?? 0,
            removedCount: output.removedCount,
            appliedScoreThreshold: output.appliedScoreThreshold
          })
        },
        execute: async (inputs: Record<string, any>) => {
          return postprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates)
        }
      },
      {
        id: "generator",
        dependencies: ["preprocessor", "postprocessor"],
        telemetry: {
          stage: "generation",
          events: {
            start: "runtime.generation.start",
            complete: "runtime.generation.complete",
            fail: "runtime.generation.fail"
          },
          extractMetrics: (output: any) => ({
            answerLength: output.answer?.length ?? 0
          })
        },
        execute: async (inputs: Record<string, any>) => {
          return generator.generate(inputs.preprocessor, inputs.postprocessor.candidates, inputs.postprocessor.promptContext)
        }
      }
    ]
  })
}
