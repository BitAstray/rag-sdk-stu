import type { Retriever, Generator } from "@rag-sdk/core"
import type { Runtime } from "../pipeline/runtime-types.js"
import { createRuntime } from "../pipeline/create-runtime.js"

export function createDefaultRuntime(config: {
  retriever: Retriever
  generator: Generator
}): Runtime {
  return createRuntime({
    retriever: config.retriever,
    generator: config.generator,
  })
}
