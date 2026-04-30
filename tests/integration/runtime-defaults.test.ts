import { describe, it, expect } from "vitest"
import type { Retriever, Generator, Chunk } from "@rag-sdk/core"
import { createDefaultRuntime, createRuntime } from "@rag-sdk/runtime"

describe("runtime defaults → core interface bridging", () => {
  const mockRetriever: Retriever = {
    async retrieve(query) {
      return [{ id: "c1", content: `results for: ${query.query}` }]
    },
  }

  const mockGenerator: Generator = {
    async generate({ chunks }: { chunks: Chunk[] }) {
      return `Generated: ${chunks.map((c) => c.content).join(", ")}`
    },
  }

  it("createDefaultRuntime accepts core Retriever + Generator", async () => {
    const runtime = createDefaultRuntime({
      retriever: mockRetriever,
      generator: mockGenerator,
    })

    const result = await runtime.run({ query: "test" })
    expect(result.answer).toContain("Generated:")
    expect(result.retrieval.chunks).toHaveLength(1)
  })

  it("createRuntime auto-wraps core interfaces", async () => {
    const runtime = createRuntime({
      retriever: mockRetriever,
      generator: mockGenerator,
    })

    const result = await runtime.run({ query: "hello" })
    expect(result.answer).toBeTruthy()
    expect(result.preRetrieval).toBeDefined()
    expect(result.retrieval).toBeDefined()
    expect(result.postRetrieval).toBeDefined()
    expect(result.generation).toBeDefined()
  })

  it("createRuntime accepts native RuntimeRetriever/RuntimeGenerator", async () => {
    const runtime = createRuntime({
      retriever: {
        __runtimeRetriever: true as const,
        async retrieve(input) {
          return { chunks: [{ id: "r1", content: input.effectiveQuery }] }
        },
      },
      generator: {
        __runtimeGenerator: true as const,
        async generate(_query, chunks) {
          return { answer: chunks.map((c) => c.content).join() }
        },
      },
    })

    const result = await runtime.run({ query: "native" })
    expect(result.answer).toBe("native")
  })

  it("runtime pipeline produces all stage results", async () => {
    const runtime = createDefaultRuntime({
      retriever: mockRetriever,
      generator: mockGenerator,
    })

    const result = await runtime.run({ query: "stages" })

    expect(result.preRetrieval.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.retrieval.retrievedCount).toBe(1)
    expect(result.retrieval.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.postRetrieval.chunks).toBeDefined()
    expect(result.postRetrieval.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.generation.answer).toBeTruthy()
    expect(result.generation.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
