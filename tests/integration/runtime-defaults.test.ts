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
    expect(result.outputs.generator.value.answer).toContain("Generated:")
    expect(result.outputs.retriever.value.candidates).toHaveLength(1)
  })

  it("createRuntime accepts native DAG nodes", async () => {
    const runtime = createRuntime({
      nodes: [
        {
          id: "preprocessor",
          dependencies: ["query"],
          execute: (inputs: any) => ({ effectiveQuery: inputs.query.query })
        },
        {
          id: "retriever",
          dependencies: ["preprocessor"],
          execute: async (inputs: any) => {
            return { candidates: [{ id: "r1", content: inputs.preprocessor.effectiveQuery }] }
          },
        },
        {
          id: "generator",
          dependencies: ["preprocessor", "retriever"],
          execute: async (inputs: any) => {
            return { answer: inputs.retriever.candidates.map((c: any) => c.content).join() }
          },
        }
      ]
    })

    const result = await runtime.run({ query: "native" })
    expect(result.outputs.generator.value.answer).toBe("native")
  })

  it("runtime pipeline produces all stage results", async () => {
    const runtime = createDefaultRuntime({
      retriever: mockRetriever,
      generator: mockGenerator,
    })

    const result = await runtime.run({ query: "stages" })

    expect(result.outputs.preprocessor.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.outputs.retriever.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.outputs.postprocessor.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.outputs.generator.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
