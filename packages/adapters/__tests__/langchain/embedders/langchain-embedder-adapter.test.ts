import { describe, it, expect, vi } from "vitest"
import { LangChainEmbedderAdapter } from "../../../src/langchain/embedders/langchain-embedder-adapter.js"

function createMockEmbeddings(vectors: number[][]) {
  return { embedDocuments: vi.fn(async () => vectors) }
}

describe("LangChainEmbedderAdapter", () => {
  it("generates vectors for chunks", async () => {
    const embeddings = createMockEmbeddings([
      [0.1, 0.2],
      [0.3, 0.4],
    ])
    const embedder = new LangChainEmbedderAdapter({ embeddings })

    const vectors = await embedder.embed([
      { id: "c1", content: "chunk 1", metadata: { source: "test" } },
      { id: "c2", content: "chunk 2" },
    ])

    expect(vectors).toHaveLength(2)
    expect(vectors[0].id).toBe("c1")
    expect(vectors[0].values).toEqual([0.1, 0.2])
    expect(vectors[0].metadata).toEqual({ source: "test" })
    expect(vectors[1].id).toBe("c2")
    expect(vectors[1].values).toEqual([0.3, 0.4])
  })

  it("returns empty array for empty input", async () => {
    const embeddings = createMockEmbeddings([])
    const embedder = new LangChainEmbedderAdapter({ embeddings })

    const vectors = await embedder.embed([])

    expect(vectors).toEqual([])
    expect(embeddings.embedDocuments).not.toHaveBeenCalled()
  })

  it("throws on vector count mismatch", async () => {
    const embeddings = createMockEmbeddings([[0.1, 0.2]])
    const embedder = new LangChainEmbedderAdapter({ embeddings })

    await expect(
      embedder.embed([
        { id: "c1", content: "chunk 1" },
        { id: "c2", content: "chunk 2" },
        { id: "c3", content: "chunk 3" },
      ]),
    ).rejects.toThrow("1 vectors for 3 chunks")
  })

  it("passes through chunk metadata", async () => {
    const embeddings = createMockEmbeddings([[0.1]])
    const embedder = new LangChainEmbedderAdapter({ embeddings })

    const vectors = await embedder.embed([
      { id: "c1", content: "text", metadata: { key: "value", count: 42 } },
    ])

    expect(vectors[0].metadata).toEqual({ key: "value", count: 42 })
  })
})
