import { describe, it, expect } from "vitest"
import {
  PreRetrievalResultSchema,
  RetrievalResultSchema,
  PostRetrievalResultSchema,
  GenerationResultSchema,
} from "../../src/spec/stage-result.js"

describe("PreRetrievalResultSchema", () => {
  it("accepts minimal valid input", () => {
    const result = PreRetrievalResultSchema.parse({
      originalQuery: "q",
      effectiveQuery: "q",
      durationMs: 1.5,
    })
    expect(result.durationMs).toBe(1.5)
  })

  it("rejects negative durationMs", () => {
    expect(() =>
      PreRetrievalResultSchema.parse({
        originalQuery: "q",
        effectiveQuery: "q",
        durationMs: -1,
      }),
    ).toThrow()
  })
})

describe("RetrievalResultSchema", () => {
  it("accepts minimal valid input", () => {
    const result = RetrievalResultSchema.parse({
      chunks: [],
      retrievedCount: 0,
      durationMs: 0,
    })
    expect(result.chunks).toEqual([])
  })

  it("accepts chunks with metadata", () => {
    const result = RetrievalResultSchema.parse({
      chunks: [{ id: "c1", content: "hello", metadata: { source: "test" } }],
      retrievedCount: 1,
      durationMs: 10,
    })
    expect(result.chunks).toHaveLength(1)
  })

  it("rejects negative retrievedCount", () => {
    expect(() =>
      RetrievalResultSchema.parse({
        chunks: [],
        retrievedCount: -1,
        durationMs: 0,
      }),
    ).toThrow()
  })
})

describe("PostRetrievalResultSchema", () => {
  it("accepts minimal valid input", () => {
    const result = PostRetrievalResultSchema.parse({
      chunks: [],
      promptContext: null,
      removedCount: 0,
      durationMs: 0,
    })
    expect(result.promptContext).toBeNull()
  })

  it("accepts with promptContext string", () => {
    const result = PostRetrievalResultSchema.parse({
      chunks: [],
      promptContext: "assembled context",
      removedCount: 0,
      durationMs: 5,
    })
    expect(result.promptContext).toBe("assembled context")
  })
})

describe("GenerationResultSchema", () => {
  it("accepts minimal valid input", () => {
    const result = GenerationResultSchema.parse({
      answer: null,
      durationMs: 0,
    })
    expect(result.answer).toBeNull()
  })

  it("accepts with answer string", () => {
    const result = GenerationResultSchema.parse({
      answer: "generated answer",
      durationMs: 100,
    })
    expect(result.answer).toBe("generated answer")
  })

  it("rejects negative durationMs", () => {
    expect(() =>
      GenerationResultSchema.parse({
        answer: "ok",
        durationMs: -0.1,
      }),
    ).toThrow()
  })
})
