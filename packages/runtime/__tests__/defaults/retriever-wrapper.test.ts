import { describe, it, expect } from "vitest"
import { CoreRetrieverWrapper } from "../../src/defaults/retriever-wrapper.js"
import type { Retriever, Chunk } from "@rag-sdk/core"

describe("CoreRetrieverWrapper", () => {
  it("delegates to core retriever with effectiveQuery and converts to candidates", async () => {
    const chunks: Chunk[] = [{ id: "c1", content: "hello" }]
    const coreRetriever: Retriever = {
      async retrieve(q) {
        expect(q.query).toBe("effective")
        return chunks
      },
    }
    const wrapper = new CoreRetrieverWrapper(coreRetriever)
    const result = await wrapper.retrieve(
      { originalQuery: "test", effectiveQuery: "effective" },
    )
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].id).toBe("c1")
    expect(result.candidates[0].content).toBe("hello")
  })

  it("propagates core retriever errors", async () => {
    const coreRetriever: Retriever = {
      async retrieve() {
        throw new Error("vector store down")
      },
    }
    const wrapper = new CoreRetrieverWrapper(coreRetriever)
    await expect(
      wrapper.retrieve(
        { originalQuery: "test", effectiveQuery: "test" },
      ),
    ).rejects.toThrow("vector store down")
  })

  it("converts core chunks to retrieval candidates", async () => {
    const chunks: Chunk[] = [
      { id: "c1", content: "a", metadata: { source: "doc1" } },
      { id: "c2", content: "b" },
    ]
    const coreRetriever: Retriever = {
      async retrieve() {
        return chunks
      },
    }
    const wrapper = new CoreRetrieverWrapper(coreRetriever)
    const result = await wrapper.retrieve(
      { originalQuery: "test", effectiveQuery: "test" },
    )
    expect(result.candidates).toHaveLength(2)
    expect(result.candidates[0].metadata).toEqual({ source: "doc1" })
    expect(result.candidates[1].metadata).toBeUndefined()
  })
})
