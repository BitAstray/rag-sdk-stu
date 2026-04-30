import { describe, it, expect } from "vitest"
import type { Retriever } from "../../src/interfaces/retriever.js"
import type { Generator } from "../../src/interfaces/generator.js"
import type { RAGPipeline } from "../../src/pipeline/types.js"
import type { Query } from "../../src/spec/query.js"
import type { Chunk } from "../../src/spec/chunk.js"
import type { RAGResponse } from "../../src/spec/rag-response.js"

describe("Interface type compatibility", () => {
  it("a mock object satisfies Retriever", () => {
    const retriever: Retriever = {
      async retrieve(_query: Query): Promise<Chunk[]> {
        return [{ id: "1", content: "chunk" }]
      },
    }
    expect(typeof retriever.retrieve).toBe("function")
  })

  it("a mock object satisfies Generator", () => {
    const generator: Generator = {
      async generate(input: { query: Query; chunks: Chunk[] }): Promise<string> {
        return `Answer for: ${input.query.query}`
      },
    }
    expect(typeof generator.generate).toBe("function")
  })

  it("RAGPipeline has correct signature", () => {
    const pipeline: RAGPipeline = async (query: Query): Promise<RAGResponse> => ({
      answer: "42",
      chunks: [],
    })
    expect(typeof pipeline).toBe("function")
  })
})
