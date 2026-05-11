import { describe, it, expect } from "vitest"
import type { Document } from "@rag-sdk/core"
import { SimpleChunker, MockEmbedder, MemoryVectorStore, PipelineSteps } from "@rag-sdk/indexing"

describe("indexing stores → full storage chain", () => {
  it("chunk → embed → store chain works end-to-end", async () => {
    const chunker = new SimpleChunker()
    const embedder = new MockEmbedder()
    const store = new MemoryVectorStore()

    const doc: Document = { id: "doc-1", content: "The quick brown fox jumps over the lazy dog" }
    const chunks = await chunker.chunk(doc)
    expect(chunks.length).toBeGreaterThan(0)

    const vectors = await embedder.embed(chunks)
    expect(vectors).toHaveLength(chunks.length)

    await store.upsert(vectors)
    const stored = store.getAll()
    expect(stored).toHaveLength(vectors.length)
    expect(stored[0]!.values.length).toBeGreaterThan(0)
  })

  it("runIndexing with MemoryVectorStore stores all vectors", async () => {
    const chunker = new SimpleChunker()
    const embedder = new MockEmbedder()
    const store = new MemoryVectorStore()
    const docs: Document[] = [
      { id: "d1", content: "First document about AI" },
      { id: "d2", content: "Second document about databases" },
    ]

    const result = await PipelineSteps.fromLoader({ async load() { return docs } })
      .pipe(PipelineSteps.chunk(chunker))
      .pipe(PipelineSteps.embed(embedder))
      .pipe(PipelineSteps.store(store))
      .consume()

    expect(result.totalDocuments).toBe(2)
    expect(result.errors).toHaveLength(0)
    expect(store.getAll().length).toBeGreaterThan(0)
  })

  it("MemoryVectorStore upsert deduplicates by id", async () => {
    const store = new MemoryVectorStore()

    await store.upsert([
      { id: "v1", values: [1, 0, 0] },
      { id: "v2", values: [0, 1, 0] },
    ])
    await store.upsert([
      { id: "v1", values: [0, 0, 1] }, // overwrite v1
    ])

    const all = store.getAll()
    expect(all).toHaveLength(2)
    const v1 = all.find((v) => v.id === "v1")
    expect(v1!.values).toEqual([0, 0, 1])
  })
})
