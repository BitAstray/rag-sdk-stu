import { describe, it, expect } from "vitest"
import { SimpleChunker } from "../../src/chunkers/simple-chunker.js"
import type { Document } from "@rag-sdk/core"

describe("SimpleChunker", () => {
  it("returns a single chunk for a short document", async () => {
    const chunker = new SimpleChunker({ chunkSize: 100, overlap: 0 })
    const doc: Document = { id: "d1", content: "short text" }
    const chunks = await chunker.chunk(doc)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe("short text")
  })

  it("splits a long document into multiple chunks", async () => {
    const chunker = new SimpleChunker({ chunkSize: 10, overlap: 0 })
    const doc: Document = { id: "d1", content: "abcdefghij klmnopqrst" }
    const chunks = await chunker.chunk(doc)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it("handles overlap correctly", async () => {
    const chunker = new SimpleChunker({ chunkSize: 10, overlap: 5 })
    const doc: Document = { id: "d1", content: "abcdefghij klmnopqrst" }
    const chunks = await chunker.chunk(doc)
    expect(chunks.length).toBeGreaterThan(1)
    // second chunk should start 5 chars after first chunk start
    if (chunks.length >= 2) {
      const firstStart = doc.content.indexOf(chunks[0].content)
      const secondStart = doc.content.indexOf(chunks[1].content)
      expect(secondStart - firstStart).toBe(5)
    }
  })

  it("returns empty array for empty content", async () => {
    const chunker = new SimpleChunker({ chunkSize: 100, overlap: 0 })
    const doc: Document = { id: "d1", content: "" }
    const chunks = await chunker.chunk(doc)
    expect(chunks).toHaveLength(0)
  })

  it("preserves document id in chunk metadata", async () => {
    const chunker = new SimpleChunker({ chunkSize: 100, overlap: 0 })
    const doc: Document = { id: "d1", content: "hello" }
    const chunks = await chunker.chunk(doc)
    expect(chunks[0].id).toContain("d1")
  })

  it("throws when overlap >= chunkSize", () => {
    expect(() => new SimpleChunker({ chunkSize: 10, overlap: 10 })).toThrow()
    expect(() => new SimpleChunker({ chunkSize: 10, overlap: 15 })).toThrow()
  })

  it("handles CJK characters correctly", async () => {
    const chunker = new SimpleChunker({ chunkSize: 10, overlap: 0 })
    const doc: Document = { id: "d1", content: "这是一个中文测试文档内容" }
    const chunks = await chunker.chunk(doc)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(10)
    }
  })
})
