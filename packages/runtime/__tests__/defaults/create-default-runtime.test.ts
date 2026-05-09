import { describe, it, expect } from "vitest"
import { createDefaultRuntime } from "../../src/defaults/create-default-runtime.js"
import type { Retriever, Generator, Chunk } from "@rag-sdk/core"

describe("createDefaultRuntime", () => {
  const chunks: Chunk[] = [
    { id: "c1", content: "RAG is powerful" },
    { id: "c2", content: "vector databases" },
  ]

  const retriever: Retriever = {
    async retrieve(q) {
      return chunks.filter((c) => c.content.includes(q.query))
    },
  }

  const generator: Generator = {
    async generate({ query, chunks }) {
      return `Answer for "${query.query}" using ${chunks.length} chunks`
    },
  }

  it("creates a runtime with run() method", () => {
    const runtime = createDefaultRuntime({ retriever, generator })
    expect(typeof runtime.run).toBe("function")
  })

  it("runtime.run() executes all 4 stages", async () => {
    const runtime = createDefaultRuntime({ retriever, generator })
    const result = await runtime.run({ query: "RAG" })

    expect(result.preRetrieval).not.toBeNull()
    expect(result.retrieval).not.toBeNull()
    expect(result.postRetrieval).not.toBeNull()
    expect(result.generation).not.toBeNull()
  })

  it("runtime.run() returns valid RuntimeResult", async () => {
    const runtime = createDefaultRuntime({ retriever, generator })
    const result = await runtime.run({ query: "RAG" })

    expect(result.answer).toContain("RAG")
    expect(result.candidates.length).toBeGreaterThan(0)
    expect(result.originalQuery.query).toBe("RAG")
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
