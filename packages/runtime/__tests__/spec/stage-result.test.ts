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
      candidates: [],
      retrievedCount: 0,
      durationMs: 0,
    })
    expect(result.candidates).toEqual([])
  })

  it("accepts candidates with metadata", () => {
    const result = RetrievalResultSchema.parse({
      candidates: [{ id: "c1", content: "hello", metadata: { source: "test" } }],
      retrievedCount: 1,
      durationMs: 10,
    })
    expect(result.candidates).toHaveLength(1)
  })

  it("rejects negative retrievedCount", () => {
    expect(() =>
      RetrievalResultSchema.parse({
        candidates: [],
        retrievedCount: -1,
        durationMs: 0,
      }),
    ).toThrow()
  })
})

describe("PostRetrievalResultSchema", () => {
  it("accepts minimal valid input", () => {
    const result = PostRetrievalResultSchema.parse({
      candidates: [],
      promptContext: null,
      selectedCandidates: [],
      droppedCandidates: [],
      selectionTrace: [],
      removedCount: 0,
      durationMs: 0,
    })
    expect(result.promptContext).toBeNull()
  })

  it("accepts with promptContext string", () => {
    const result = PostRetrievalResultSchema.parse({
      candidates: [],
      promptContext: "assembled context",
      selectedCandidates: [],
      droppedCandidates: [],
      selectionTrace: [],
      removedCount: 0,
      durationMs: 5,
    })
    expect(result.promptContext).toBe("assembled context")
  })

  it("accepts with selection trace and dropped candidates", () => {
    const result = PostRetrievalResultSchema.parse({
      candidates: [{ id: "c1", content: "kept" }],
      promptContext: null,
      selectedCandidates: [{ id: "c1", content: "kept" }],
      droppedCandidates: [{ id: "c2", content: "dropped" }],
      selectionTrace: [
        { stage: "score-threshold", action: "dropped", candidateId: "c2", reason: "score below threshold" },
      ],
      appliedScoreThreshold: 0.5,
      removedCount: 1,
      durationMs: 2,
    })
    expect(result.droppedCandidates).toHaveLength(1)
    expect(result.selectionTrace).toHaveLength(1)
    expect(result.appliedScoreThreshold).toBe(0.5)
  })

  it("accepts with appliedBudget", () => {
    const result = PostRetrievalResultSchema.parse({
      candidates: [],
      promptContext: null,
      selectedCandidates: [],
      droppedCandidates: [],
      selectionTrace: [],
      appliedBudget: { maxCandidates: 10 },
      removedCount: 0,
      durationMs: 1,
    })
    expect(result.appliedBudget?.maxCandidates).toBe(10)
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
