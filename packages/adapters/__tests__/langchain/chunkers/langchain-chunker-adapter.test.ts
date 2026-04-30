import { describe, it, expect, vi } from "vitest"
import { LangChainChunkerAdapter } from "../../../src/langchain/chunkers/langchain-chunker-adapter.js"

function createMockSplitter(
  chunks: { pageContent: string; metadata?: Record<string, unknown> }[],
) {
  return { splitDocuments: vi.fn(async () => chunks) }
}

describe("LangChainChunkerAdapter", () => {
  it("splits document into chunks", async () => {
    const splitter = createMockSplitter([
      { pageContent: "chunk 1" },
      { pageContent: "chunk 2" },
    ])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({
      id: "doc-1",
      content: "some content",
      metadata: { source: "test" },
    })

    expect(chunks).toHaveLength(2)
    expect(chunks[0].content).toBe("chunk 1")
    expect(chunks[1].content).toBe("chunk 2")
  })

  it("skips blank chunks", async () => {
    const splitter = createMockSplitter([
      { pageContent: "chunk 1" },
      { pageContent: "   " },
      { pageContent: "chunk 2" },
    ])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({
      id: "doc-1",
      content: "content",
    })

    expect(chunks).toHaveLength(2)
    expect(chunks[0].content).toBe("chunk 1")
    expect(chunks[1].content).toBe("chunk 2")
  })

  it("assigns contiguous chunkIndex after skipping blanks", async () => {
    const splitter = createMockSplitter([
      { pageContent: "chunk 1" },
      { pageContent: "" },
      { pageContent: "chunk 2" },
    ])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({ id: "doc-1", content: "content" })

    expect(chunks[0].id).toBe("doc-1::0")
    expect(chunks[0].metadata?.chunkIndex).toBe("0")
    expect(chunks[1].id).toBe("doc-1::1")
    expect(chunks[1].metadata?.chunkIndex).toBe("1")
  })

  it("sets sourceDocumentId in metadata", async () => {
    const splitter = createMockSplitter([{ pageContent: "chunk" }])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({ id: "doc-42", content: "content" })

    expect(chunks[0].metadata?.sourceDocumentId).toBe("doc-42")
  })

  it("merges splitter metadata with chunk metadata", async () => {
    const splitter = createMockSplitter([
      { pageContent: "chunk", metadata: { custom: "value" } },
    ])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({ id: "doc-1", content: "content" })

    expect(chunks[0].metadata?.custom).toBe("value")
    expect(chunks[0].metadata?.sourceDocumentId).toBe("doc-1")
  })

  it("returns empty array for empty document", async () => {
    const splitter = createMockSplitter([])
    const chunker = new LangChainChunkerAdapter({ splitter })

    const chunks = await chunker.chunk({ id: "doc-1", content: "" })

    expect(chunks).toEqual([])
  })
})
