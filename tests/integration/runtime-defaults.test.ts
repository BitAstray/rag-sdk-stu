import { describe, it, expect } from "vitest"
import type { Retriever, Generator, Chunk } from "@rag-sdk/core"
import { createDefaultRuntime, createRuntime, CoreRetrieverWrapper, CoreGeneratorWrapper } from "@rag-sdk/runtime"

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
    expect(result.retrieval.candidates).toHaveLength(1)
  })

  it("createRuntime accepts wrapped core interfaces", async () => {
    const runtime = createRuntime({
      retriever: new CoreRetrieverWrapper(mockRetriever),
      generator: new CoreGeneratorWrapper(mockGenerator),
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
        async retrieve(input) {
          return { candidates: [{ id: "r1", content: input.effectiveQuery }] }
        },
      },
      generator: {
        async generate(_query, candidates) {
          return { answer: candidates.map((c) => c.content).join() }
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
    expect(result.postRetrieval.candidates).toBeDefined()
    expect(result.postRetrieval.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.generation.answer).toBeTruthy()
    expect(result.generation.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
