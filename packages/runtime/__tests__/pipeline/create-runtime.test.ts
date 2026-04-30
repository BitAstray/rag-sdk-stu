import { describe, it, expect } from "vitest"
import { createRuntime } from "../../src/pipeline/create-runtime.js"
import { NoopQueryPreprocessor } from "../../src/defaults/noop-query-preprocessor.js"
import { PassthroughRetrievalPostprocessor } from "../../src/defaults/passthrough-postprocessor.js"
import type { Retriever, Generator, Chunk } from "@rag-sdk/core"
import type { RuntimeRetriever, RuntimeGenerator, QueryPreprocessor } from "../../src/index.js"

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

  it("accepts core Retriever + Generator and wraps them", async () => {
    const runtime = createRuntime({
      retriever: coreRetriever,
      generator: coreGenerator,
    })
    const result = await runtime.run({ query: "test" })
    expect(result.answer).toBe("answer")
  })

  it("accepts RuntimeRetriever + RuntimeGenerator directly", async () => {
    const runtimeRetriever: RuntimeRetriever = {
      __runtimeRetriever: true,
      async retrieve() {
        return { chunks, debug: { source: "test" } }
      },
    }
    const runtimeGenerator: RuntimeGenerator = {
      __runtimeGenerator: true,
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
      __runtimeRetriever: true,
      async retrieve(input) {
        expect(input.effectiveQuery).toBe("TEST")
        expect(input.strategy).toBe("custom")
        return { chunks }
      },
    }
    const runtime = createRuntime({
      retriever: runtimeRetriever,
      generator: coreGenerator,
      preprocessor: customPreprocessor,
    })
    await runtime.run({ query: "test" })
  })

  it("uses provided postprocessor instead of PassthroughRetrievalPostprocessor", async () => {
    const customPostprocessor = {
      async postprocess() {
        return {
          chunks: [{ id: "filtered", content: "filtered" }],
          promptContext: "custom context",
        }
      },
    }
    const runtime = createRuntime({
      retriever: coreRetriever,
      generator: coreGenerator,
      postprocessor: customPostprocessor,
    })
    const result = await runtime.run({ query: "test" })
    expect(result.chunks[0].id).toBe("filtered")
    expect(result.postRetrieval?.promptContext).toBe("custom context")
  })

  it("returns Runtime with run() method", () => {
    const runtime = createRuntime({
      retriever: coreRetriever,
      generator: coreGenerator,
    })
    expect(runtime).toHaveProperty("run")
    expect(typeof runtime.run).toBe("function")
  })
})
