import { describe, it, expect } from "vitest"
import { createRuntime } from "../../src/pipeline/create-runtime.js"
import { CoreRetrieverWrapper } from "../../src/defaults/retriever-wrapper.js"
import { CoreGeneratorWrapper } from "../../src/defaults/generator-wrapper.js"
import type { Retriever, Generator, Chunk } from "@rag-sdk/core"
import type { RuntimeRetriever, RuntimeGenerator, QueryPreprocessor } from "../../src/index.js"
import type { RetrievalPostprocessorResult } from "../../src/interfaces/retrieval-postprocessor.js"

function makePostprocessorResult(
  candidates: Array<{ id: string; content: string }>,
  promptContext: string | null = null,
): RetrievalPostprocessorResult {
  return {
    candidates,
    promptContext,
  }
}

describe("createRuntime", () => {
  const chunks: Chunk[] = [{ id: "c1", content: "hello" }]

  const coreRetriever: Retriever = {
    async retrieve() {
      return chunks
    },
  }

  const coreGenerator: Generator = {
    async generate() {
      return "answer"
    },
  }

  it("accepts RuntimeRetriever + RuntimeGenerator", async () => {
    const runtime = createRuntime({
      retriever: new CoreRetrieverWrapper(coreRetriever),
      generator: new CoreGeneratorWrapper(coreGenerator),
    })
    const result = await runtime.run({ query: "test" })
    expect(result.answer).toBe("answer")
  })

  it("accepts custom RuntimeRetriever + RuntimeGenerator directly", async () => {
    const runtimeRetriever: RuntimeRetriever = {
      async retrieve() {
        return { candidates: [{ id: "c1", content: "hello" }], debug: { source: "test" } }
      },
    }
    const runtimeGenerator: RuntimeGenerator = {
      async generate() {
        return { answer: "runtime answer" }
      },
    }
    const runtime = createRuntime({
      retriever: runtimeRetriever,
      generator: runtimeGenerator,
    })
    const result = await runtime.run({ query: "test" })
    expect(result.answer).toBe("runtime answer")
  })

  it("uses provided preprocessor instead of NoopQueryPreprocessor", async () => {
    const customPreprocessor: QueryPreprocessor = {
      async preprocess(query) {
        return {
          originalQuery: query.query,
          effectiveQuery: query.query.toUpperCase(),
          strategy: "custom",
        }
      },
    }
    const runtimeRetriever: RuntimeRetriever = {
      async retrieve(input) {
        expect(input.effectiveQuery).toBe("TEST")
        expect(input.strategy).toBe("custom")
        return { candidates: [{ id: "c1", content: "hello" }] }
      },
    }
    const runtime = createRuntime({
      retriever: runtimeRetriever,
      generator: new CoreGeneratorWrapper(coreGenerator),
      preprocessor: customPreprocessor,
    })
    await runtime.run({ query: "test" })
  })

  it("uses provided postprocessor instead of PassthroughRetrievalPostprocessor", async () => {
    const customPostprocessor = {
      async postprocess() {
        return makePostprocessorResult(
          [{ id: "filtered", content: "filtered" }],
          "custom context",
        )
      },
    }
    const runtime = createRuntime({
      retriever: new CoreRetrieverWrapper(coreRetriever),
      generator: new CoreGeneratorWrapper(coreGenerator),
      postprocessor: customPostprocessor,
    })
    const result = await runtime.run({ query: "test" })
    expect(result.candidates[0].id).toBe("filtered")
    expect(result.postRetrieval?.promptContext).toBe("custom context")
  })

  it("returns Runtime with run() method", () => {
    const runtime = createRuntime({
      retriever: new CoreRetrieverWrapper(coreRetriever),
      generator: new CoreGeneratorWrapper(coreGenerator),
    })
    expect(runtime).toHaveProperty("run")
    expect(typeof runtime.run).toBe("function")
  })
})
