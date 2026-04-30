import type { Retriever, Generator } from "@rag-sdk/core"
import type { Runtime } from "../pipeline/runtime-types.js"
import { createRuntime } from "../pipeline/create-runtime.js"
import { CoreRetrieverWrapper } from "./retriever-wrapper.js"
import { CoreGeneratorWrapper } from "./generator-wrapper.js"

export function createDefaultRuntime(config: {
  retriever: Retriever
  generator: Generator
}): Runtime {
  return createRuntime({
    retriever: new CoreRetrieverWrapper(config.retriever),
    generator: new CoreGeneratorWrapper(config.generator),
  })
}
