import { describe, it, expect } from "vitest"
import { createPostprocessorPipeline } from "../../../src/defaults/postprocessor/pipeline.js"
import {
  scoreThreshold,
  budgetTrim,
  predicateFilter,
  nearDuplicateRemoval,
  sourceCoverage
} from "../../../src/defaults/postprocessor/strategies.js"
import { contextOrdering } from "../../../src/defaults/postprocessor/context-ordering.js"
import type { RetrievalCandidate } from "../../../src/spec/retrieval-candidate.js"

function makeCandidates(): RetrievalCandidate[] {
  return [
    { id: "c1", content: "hello", rerankingScore: 0.9, source: "doc1" },
    { id: "c2", content: "world", rerankingScore: 0.5, source: "doc1" },
    { id: "c3", content: "foo", rerankingScore: 0.3, source: "doc2" },
  ]
}

const query = { originalQuery: "test", effectiveQuery: "test" }

describe("createPostprocessorPipeline", () => {
  it("passes through with no config", async () => {
    const pp = createPostprocessorPipeline([contextOrdering()])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(3)
    expect(result.detail?.droppedCandidates).toHaveLength(0)
    // context-ordering always records trace entries
    expect(result.detail?.selectionTrace).toHaveLength(3)
    expect(result.promptContext).toContain("hello")
  })

  it("applies score threshold", async () => {
    const pp = createPostprocessorPipeline([scoreThreshold(0.6)])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(1)
    expect(result.detail?.droppedCandidates).toHaveLength(2)
    expect(result.detail?.appliedScoreThreshold).toBe(0.6)
    expect(result.detail?.selectionTrace.length).toBeGreaterThan(0)
  })

  it("applies budget", async () => {
    const pp = createPostprocessorPipeline([budgetTrim({ maxCandidates: 2 })])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(2)
    expect(result.detail?.droppedCandidates).toHaveLength(1)
    expect(result.detail?.appliedBudget).toEqual({ maxCandidates: 2 })
  })

  it("applies deduplication", async () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "same" },
      { id: "c2", content: "same" },
      { id: "c3", content: "different" },
    ]
    const pp = createPostprocessorPipeline([nearDuplicateRemoval()])
    const result = await pp.postprocess(query, candidates)

    expect(result.candidates).toHaveLength(2)
    expect(result.detail?.droppedCandidates).toHaveLength(1)
  })

  it("applies source coverage", async () => {
    const pp = createPostprocessorPipeline([sourceCoverage(1)])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(2)
    expect(result.detail?.droppedCandidates).toHaveLength(1)
  })

  it("applies custom predicate", async () => {
    const pp = createPostprocessorPipeline([
      predicateFilter(async ({ candidate }) => (candidate.rerankingScore ?? 0) > 0.4),
    ])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(2)
    expect(result.detail?.droppedCandidates).toHaveLength(1)
  })

  it("applies context ordering", async () => {
    const pp = createPostprocessorPipeline([
      contextOrdering((a, b) => (b.rerankingScore ?? 0) - (a.rerankingScore ?? 0)),
    ])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates.map(c => c.id)).toEqual(["c1", "c2", "c3"])
  })

  it("combines multiple strategies", async () => {
    const pp = createPostprocessorPipeline([
      scoreThreshold(0.4),
      sourceCoverage(1),
      budgetTrim({ maxCandidates: 1 }),
    ])
    const result = await pp.postprocess(query, makeCandidates())

    expect(result.candidates).toHaveLength(1)
    expect(result.detail?.selectionTrace.length).toBeGreaterThan(0)
  })
})
