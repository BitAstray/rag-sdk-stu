import { describe, it, expect } from "vitest"
import { PipelineSteps } from "../../src/pipeline/pipeline.js"
import { SimpleChunker } from "../../src/chunkers/simple-chunker.js"
import { MockEmbedder } from "../../src/embedders/mock-embedder.js"
import { MemoryVectorStore } from "../../src/stores/memory-vector-store.js"
import type { Loader, DocumentTransformer } from "../../src/types/index.js"
import type { Document } from "@rag-sdk/core"

class MockLoader implements Loader {
  constructor(private readonly docs: Document[]) {}
  async load(): Promise<Document[]> {
    return this.docs
  }
}

describe("Indexing Pipeline", () => {
  it("runs minimal pipeline with defaults", async () => {
    const store = new MemoryVectorStore()
    const pipeline = PipelineSteps.fromLoader(new MockLoader([{ id: "d1", content: "hello world test content" }]))
      .pipe(PipelineSteps.chunk(new SimpleChunker()))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    const result = await pipeline.consume()
    
    expect(result.totalDocuments).toBe(1)
    expect(result.totalChunks).toBeGreaterThan(0)
    expect(store.getAll().length).toBeGreaterThan(0)
  })

  it("respects custom chunker", async () => {
    const store = new MemoryVectorStore()
    const pipeline = PipelineSteps.fromLoader(new MockLoader([{ id: "d1", content: "a".repeat(100) }]))
      .pipe(PipelineSteps.chunk(new SimpleChunker({ chunkSize: 50, overlap: 0 })))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    const result = await pipeline.consume()
    expect(result.totalChunks).toBe(2)
  })

  it("applies transformer to documents", async () => {
    const store = new MemoryVectorStore()
    const transformer: DocumentTransformer = {
      async transform(doc: Document): Promise<Document> {
        return { ...doc, content: doc.content.toUpperCase() }
      },
    }
    const pipeline = PipelineSteps.fromLoader(new MockLoader([{ id: "d1", content: "hello" }]))
      .pipe(PipelineSteps.transform(transformer))
      .pipe(PipelineSteps.chunk(new SimpleChunker({ chunkSize: 100, overlap: 0 })))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    await pipeline.consume()
    const vectors = store.getAll()
    expect(vectors.length).toBeGreaterThan(0)
  })

  it("filters documents with filter step", async () => {
    const store = new MemoryVectorStore()
    const pipeline = PipelineSteps.fromLoader(new MockLoader([
        { id: "d1", content: "include me" },
        { id: "d2", content: "exclude me" },
      ]))
      .pipe(PipelineSteps.filter((doc) => doc.id === "d1"))
      .pipe(PipelineSteps.chunk(new SimpleChunker()))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    const result = await pipeline.consume()
    expect(result.totalDocuments).toBe(1)
  })

  it("continues on document failure and tracks errors", async () => {
    const store = new MemoryVectorStore()
    const badLoader: Loader = {
      async load() {
        throw new Error("load failed")
      },
    }
    const pipeline = PipelineSteps.fromLoader(badLoader)
      .pipe(PipelineSteps.chunk(new SimpleChunker()))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    const result = await pipeline.consume()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain("load failed")
  })

  it("handles empty document list", async () => {
    const store = new MemoryVectorStore()
    const pipeline = PipelineSteps.fromLoader(new MockLoader([]))
      .pipe(PipelineSteps.chunk(new SimpleChunker()))
      .pipe(PipelineSteps.embed(new MockEmbedder({ dimension: 10 })))
      .pipe(PipelineSteps.store(store))
    
    const result = await pipeline.consume()
    expect(result.totalDocuments).toBe(0)
    expect(result.totalChunks).toBe(0)
  })
})
