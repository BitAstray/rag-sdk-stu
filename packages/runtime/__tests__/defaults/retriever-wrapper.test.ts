import { describe, it, expect } from "vitest"
import { CoreRetrieverWrapper } from "../../src/defaults/retriever-wrapper.js"
import { RuntimeError } from "../../src/errors/runtime.js"
import type { Retriever, Chunk } from "@rag-sdk/core"

describe("CoreRetrieverWrapper", () => {
  const context = {
    originalQuery: { query: "test" },
    preprocessed: null,
    chunks: [],
    promptContext: null,
    metadata: {},
  }

  it("delegates to core retriever with effectiveQuery", async () => {
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
      context,
    )
    expect(result.chunks).toEqual(chunks)
  })

  it("wraps retrieval error into RuntimeError with stage='retrieval'", async () => {
    const coreRetriever: Retriever = {
      async retrieve() {
        throw new Error("vector store down")
      },
    }
    const wrapper = new CoreRetrieverWrapper(coreRetriever)
    await expect(
      wrapper.retrieve(
        { originalQuery: "test", effectiveQuery: "test" },
        context,
      ),
    ).rejects.toThrow(RuntimeError)

    try {
      await wrapper.retrieve(
        { originalQuery: "test", effectiveQuery: "test" },
        context,
      )
    } catch (e) {
      expect(e).toBeInstanceOf(RuntimeError)
      expect((e as RuntimeError).stage).toBe("retrieval")
      expect((e as RuntimeError).cause).toBeDefined()
    }
  })

  it("passes chunks through correctly", async () => {
    const chunks: Chunk[] = [
      { id: "c1", content: "a" },
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
      context,
    )
    expect(result.chunks).toHaveLength(2)
    expect(result.chunks[0].id).toBe("c1")
  })
})
