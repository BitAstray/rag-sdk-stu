import { describe, it, expect } from "vitest"
import { runRuntime } from "../../src/pipeline/run-runtime.js"
import { RuntimeError } from "../../src/errors/runtime.js"
import type { InternalConfig } from "../../src/pipeline/run-runtime.js"
import type { Chunk } from "@rag-sdk/core"

function makeConfig(overrides: Partial<InternalConfig> = {}): InternalConfig {
  return {
    preprocessor: {
      async preprocess(query) {
        return { originalQuery: query.query, effectiveQuery: query.query }
      },
    },
    retriever: {
      async retrieve() {
        return { chunks: [{ id: "c1", content: "hello" }] }
      },
    },
    postprocessor: {
      async postprocess(_q, chunks) {
        return { chunks, promptContext: null }
      },
    },
    generator: {
      async generate() {
        return { answer: "answer" }
      },
    },
    ...overrides,
  }
}

describe("runRuntime", () => {
  it("executes all 4 stages in order", async () => {
    const order: string[] = []
    const config = makeConfig({
      preprocessor: {
        async preprocess(query) {
          order.push("pre-retrieval")
          return { originalQuery: query.query, effectiveQuery: query.query }
        },
      },
      retriever: {
        async retrieve() {
          order.push("retrieval")
          return { chunks: [] }
        },
      },
      postprocessor: {
        async postprocess(_q, chunks) {
          order.push("post-retrieval")
          return { chunks, promptContext: null }
        },
      },
      generator: {
        async generate() {
          order.push("generation")
          return { answer: "ok" }
        },
      },
    })

    await runRuntime({ query: "test" }, config)
    expect(order).toEqual(["pre-retrieval", "retrieval", "post-retrieval", "generation"])
  })

  it("passes RuntimeContext through all stages", async () => {
    const config = makeConfig({
      retriever: {
        async retrieve(_input, context) {
          expect(context.preprocessed).not.toBeNull()
          return { chunks: [{ id: "c1", content: "test" }] }
        },
      },
      postprocessor: {
        async postprocess(_q, chunks, context) {
          expect(context.chunks).toHaveLength(1)
          return { chunks, promptContext: "ctx" }
        },
      },
      generator: {
        async generate(_q, chunks, promptContext, context) {
          expect(context.promptContext).toBe("ctx")
          return { answer: "ok" }
        },
      },
    })

    await runRuntime({ query: "test" }, config)
  })

  it("records timing for each stage", async () => {
    const result = await runRuntime({ query: "test" }, makeConfig())
    expect(result.preRetrieval?.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.retrieval?.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.postRetrieval?.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.generation?.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("returns final chunks from post-retrieval (not retrieval)", async () => {
    const config = makeConfig({
      retriever: {
        async retrieve() {
          return {
            chunks: [
              { id: "c1", content: "a" },
              { id: "c2", content: "b" },
            ],
          }
        },
      },
      postprocessor: {
        async postprocess() {
          return {
            chunks: [{ id: "c1", content: "a" }],
            promptContext: null,
          }
        },
      },
    })

    const result = await runRuntime({ query: "test" }, config)
    expect(result.chunks).toHaveLength(1)
    expect(result.chunks[0].id).toBe("c1")
    expect(result.postRetrieval?.removedCount).toBe(1)
  })

  it("wraps stage errors into RuntimeError with correct stage", async () => {
    const stages = ["pre-retrieval", "retrieval", "post-retrieval", "generation"] as const

    for (const stage of stages) {
      const configOverrides: Partial<InternalConfig> = {}
      if (stage === "pre-retrieval") {
        configOverrides.preprocessor = {
          async preprocess() {
            throw new Error("fail")
          },
        }
      } else if (stage === "retrieval") {
        configOverrides.retriever = {
          async retrieve() {
            throw new Error("fail")
          },
        }
      } else if (stage === "post-retrieval") {
        configOverrides.postprocessor = {
          async postprocess() {
            throw new Error("fail")
          },
        }
      } else {
        configOverrides.generator = {
          async generate() {
            throw new Error("fail")
          },
        }
      }

      try {
        await runRuntime({ query: "test" }, makeConfig(configOverrides))
        expect.fail(`should have thrown for ${stage}`)
      } catch (e) {
        expect(e).toBeInstanceOf(RuntimeError)
        expect((e as RuntimeError).stage).toBe(stage)
      }
    }
  })

  it("preserves existing RuntimeError without double-wrapping", async () => {
    const original = new RuntimeError("retrieval", "original error")
    const config = makeConfig({
      retriever: {
        async retrieve() {
          throw original
        },
      },
    })

    try {
      await runRuntime({ query: "test" }, config)
      expect.fail("should have thrown")
    } catch (e) {
      expect(e).toBe(original)
    }
  })

  it("includes originalQuery and preprocessed in result", async () => {
    const result = await runRuntime({ query: "test" }, makeConfig())
    expect(result.originalQuery.query).toBe("test")
    expect(result.preprocessed?.originalQuery).toBe("test")
    expect(result.preprocessed?.effectiveQuery).toBe("test")
  })

  it("handles null answer from generator", async () => {
    const config = makeConfig({
      generator: {
        async generate() {
          return { answer: null }
        },
      },
    })
    const result = await runRuntime({ query: "test" }, config)
    expect(result.answer).toBeNull()
  })

  it("works with empty chunk results", async () => {
    const config = makeConfig({
      retriever: {
        async retrieve() {
          return { chunks: [] }
        },
      },
    })
    const result = await runRuntime({ query: "test" }, config)
    expect(result.chunks).toEqual([])
    expect(result.retrieval?.retrievedCount).toBe(0)
  })
})
