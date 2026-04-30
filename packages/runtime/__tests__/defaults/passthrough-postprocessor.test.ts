import { describe, it, expect } from "vitest"
import { PassthroughRetrievalPostprocessor } from "../../src/defaults/passthrough-postprocessor.js"
import type { Chunk } from "@rag-sdk/core"

describe("PassthroughRetrievalPostprocessor", () => {
  const postprocessor = new PassthroughRetrievalPostprocessor()
  const query = { originalQuery: "test", effectiveQuery: "test" }
  const context = {
    originalQuery: { query: "test" },
    preprocessed: null,
    chunks: [],
    promptContext: null,
    metadata: {},
  }

  it("returns chunks unchanged", async () => {
    const chunks: Chunk[] = [
      { id: "c1", content: "hello" },
      { id: "c2", content: "world" },
    ]
    const result = await postprocessor.postprocess(query, chunks, context)
    expect(result.chunks).toEqual(chunks)
  })

  it("returns promptContext as null", async () => {
    const result = await postprocessor.postprocess(query, [], context)
    expect(result.promptContext).toBeNull()
  })

  it("preserves chunk order", async () => {
    const chunks: Chunk[] = [
      { id: "c1", content: "first" },
      { id: "c2", content: "second" },
      { id: "c3", content: "third" },
    ]
    const result = await postprocessor.postprocess(query, chunks, context)
    expect(result.chunks.map((c) => c.id)).toEqual(["c1", "c2", "c3"])
  })

  it("handles empty chunks array", async () => {
    const result = await postprocessor.postprocess(query, [], context)
    expect(result.chunks).toEqual([])
    expect(result.promptContext).toBeNull()
  })
})
