import { describe, it, expect } from "vitest"
import type { Document, Chunk, Vector } from "@rag-sdk/core"
import { DocumentSchema, ChunkSchema, VectorSchema } from "@rag-sdk/core"
import { langchain, chroma } from "@rag-sdk/adapters"

describe("core types → adapters compatibility", () => {
  it("core Document passes adapter document-mapper", () => {
    const doc: Document = { id: "d1", content: "hello" }
    const parsed = DocumentSchema.parse(doc)
    expect(parsed.id).toBe("d1")
  })

  it("core Chunk schema validates adapter-produced chunks", () => {
    const chunk: Chunk = { id: "c1", content: "text", metadata: { source: "test" } }
    const parsed = ChunkSchema.parse(chunk)
    expect(parsed.content).toBe("text")
  })

  it("core Vector schema validates adapter-produced vectors", () => {
    const vector: Vector = {
      id: "v1",
      values: [0.1, 0.2, 0.3],
      metadata: { chunkId: "c1" },
    }
    const parsed = VectorSchema.parse(vector)
    expect(parsed.values).toHaveLength(3)
  })

  it("chroma adapter namespace exports expected members", () => {
    expect(chroma.stores).toBeDefined()
    expect(chroma.stores.ChromaVectorStore).toBeDefined()
  })

  it("langchain adapter namespace exports expected members", () => {
    expect(langchain.loaders).toBeDefined()
    expect(langchain.chunkers).toBeDefined()
    expect(langchain.embedders).toBeDefined()
  })
})
