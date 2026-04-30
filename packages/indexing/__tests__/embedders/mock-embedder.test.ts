import { describe, it, expect } from "vitest"
import { MockEmbedder } from "../../src/embedders/mock-embedder.js"
import type { Chunk } from "@rag-sdk/core"

describe("MockEmbedder", () => {
  it("returns the same number of vectors as chunks", async () => {
    const embedder = new MockEmbedder({ dimension: 128 })
    const chunks: Chunk[] = [
      { id: "c1", content: "hello" },
      { id: "c2", content: "world" },
    ]
    const vectors = await embedder.embed(chunks)
    expect(vectors).toHaveLength(2)
  })

  it("returns vectors with correct dimension", async () => {
    const embedder = new MockEmbedder({ dimension: 64 })
    const chunks: Chunk[] = [{ id: "c1", content: "test" }]
    const vectors = await embedder.embed(chunks)
    expect(vectors[0].values).toHaveLength(64)
  })

  it("returns normalized vectors (magnitude ~1)", async () => {
    const embedder = new MockEmbedder({ dimension: 128 })
    const chunks: Chunk[] = [{ id: "c1", content: "test" }]
    const vectors = await embedder.embed(chunks)
    const magnitude = Math.sqrt(
      vectors[0].values.reduce((sum, v) => sum + v * v, 0),
    )
    expect(magnitude).toBeCloseTo(1, 1)
  })

  it("preserves chunk id in vector id", async () => {
    const embedder = new MockEmbedder({ dimension: 10 })
    const chunks: Chunk[] = [{ id: "chunk-42", content: "test" }]
    const vectors = await embedder.embed(chunks)
    expect(vectors[0].id).toBe("chunk-42")
  })

  it("handles empty input", async () => {
    const embedder = new MockEmbedder({ dimension: 10 })
    const vectors = await embedder.embed([])
    expect(vectors).toHaveLength(0)
  })

  it("deterministic: same content produces same vector", async () => {
    const embedder = new MockEmbedder({ dimension: 10 })
    const chunks: Chunk[] = [{ id: "c1", content: "same" }]
    const v1 = await embedder.embed(chunks)
    const v2 = await embedder.embed(chunks)
    expect(v1[0].values).toEqual(v2[0].values)
  })
})
