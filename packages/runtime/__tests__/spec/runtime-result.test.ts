import { describe, it, expect } from "vitest"
import { RuntimeResultSchema } from "../../src/spec/runtime-result.js"

describe("RuntimeResultSchema", () => {
  it("accepts minimal result with null stages", () => {
    const result = RuntimeResultSchema.parse({
      answer: "ok",
      chunks: [],
      originalQuery: { query: "test" },
      preprocessed: null,
      preRetrieval: null,
      retrieval: null,
      postRetrieval: null,
      generation: null,
      durationMs: 0,
    })
    expect(result.answer).toBe("ok")
    expect(result.preRetrieval).toBeNull()
  })

  it("accepts fully populated result", () => {
    const result = RuntimeResultSchema.parse({
      answer: "answer",
      chunks: [{ id: "c1", content: "hello" }],
      originalQuery: { query: "test" },
      preprocessed: {
        originalQuery: "test",
        effectiveQuery: "test",
        topK: 5,
      },
      preRetrieval: {
        originalQuery: "test",
        effectiveQuery: "test",
        topK: 5,
        durationMs: 1,
      },
      retrieval: {
        chunks: [{ id: "c1", content: "hello" }],
        retrievedCount: 1,
        durationMs: 10,
      },
      postRetrieval: {
        chunks: [{ id: "c1", content: "hello" }],
        promptContext: "context",
        removedCount: 0,
        durationMs: 2,
      },
      generation: {
        answer: "answer",
        durationMs: 100,
      },
      durationMs: 113,
    })
    expect(result.chunks).toHaveLength(1)
    expect(result.preRetrieval?.topK).toBe(5)
  })

  it("rejects negative total durationMs", () => {
    expect(() =>
      RuntimeResultSchema.parse({
        answer: null,
        chunks: [],
        originalQuery: { query: "test" },
        preprocessed: null,
        preRetrieval: null,
        retrieval: null,
        postRetrieval: null,
        generation: null,
        durationMs: -1,
      }),
    ).toThrow()
  })
})
