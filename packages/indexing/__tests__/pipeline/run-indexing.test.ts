import { describe, it, expect } from "vitest"
import { runIndexing } from "../../src/pipeline/run-indexing.js"
import { SimpleChunker } from "../../src/chunkers/simple-chunker.js"
import { MockEmbedder } from "../../src/embedders/mock-embedder.js"
import { MemoryVectorStore } from "../../src/stores/memory-vector-store.js"
import type { Loader, DocumentTransformer } from "../../src/types/index.js"
import type { Document, Chunk } from "@rag-sdk/core"

class MockLoader implements Loader {
  constructor(private readonly docs: Document[]) {}
  async load(): Promise<Document[]> {
    return this.docs
  }
}

describe("runIndexing", () => {
  it("runs minimal pipeline with defaults", async () => {
    const store = new MemoryVectorStore()
    const result = await runIndexing({
      loader: new MockLoader([{ id: "d1", content: "hello world test content" }]),
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
    })
    expect(result.totalDocuments).toBe(1)
    expect(result.totalChunks).toBeGreaterThan(0)
    expect(store.getAll().length).toBeGreaterThan(0)
  })

  it("respects custom chunker", async () => {
    const store = new MemoryVectorStore()
    const result = await runIndexing({
      loader: new MockLoader([{ id: "d1", content: "a".repeat(100) }]),
      chunker: new SimpleChunker({ chunkSize: 50, overlap: 0 }),
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
    })
    expect(result.totalChunks).toBe(2)
  })

  it("applies transformer to documents", async () => {
    const store = new MemoryVectorStore()
    const transformer: DocumentTransformer = {
      async transform(doc: Document): Promise<Document> {
        return { ...doc, content: doc.content.toUpperCase() }
      },
    }
    await runIndexing({
      loader: new MockLoader([{ id: "d1", content: "hello" }]),
      transformer,
      chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
    })
    const vectors = store.getAll()
    expect(vectors.length).toBeGreaterThan(0)
  })

  it("filters documents with shouldIndex", async () => {
    const store = new MemoryVectorStore()
    const result = await runIndexing({
      loader: new MockLoader([
        { id: "d1", content: "include me" },
        { id: "d2", content: "exclude me" },
      ]),
      shouldIndex: (doc) => doc.id === "d1",
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
    })
    expect(result.totalDocuments).toBe(1)
  })

  it("calls onError and continues on document failure", async () => {
    const errors: Error[] = []
    const store = new MemoryVectorStore()
    const badLoader: Loader = {
      async load() {
        throw new Error("load failed")
      },
    }
    const result = await runIndexing({
      loader: badLoader,
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
      onError: (err) => errors.push(err),
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain("load failed")
  })

  it("handles empty document list", async () => {
    const store = new MemoryVectorStore()
    const result = await runIndexing({
      loader: new MockLoader([]),
      embedder: new MockEmbedder({ dimension: 10 }),
      store,
    })
    expect(result.totalDocuments).toBe(0)
    expect(result.totalChunks).toBe(0)
  })
})
