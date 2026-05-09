import { describe, it, expect } from "vitest"
import type { SelectionTraceItem } from "../../../src/spec/selection-trace.js"
import type { RetrievalCandidate } from "../../../src/spec/retrieval-candidate.js"
import {
  applyScoreThreshold,
  applyBudgetTrim,
  applyNearDuplicateRemoval,
  applySourceCoverage,
  applyPredicateFilter,
} from "../../../src/defaults/postprocessor/strategies.js"
import { applyContextOrdering } from "../../../src/defaults/postprocessor/context-ordering.js"

function makeCandidates(): RetrievalCandidate[] {
  return [
    { id: "c1", content: "hello", rerankingScore: 0.9, source: "doc1" },
    { id: "c2", content: "world", rerankingScore: 0.5, source: "doc1" },
    { id: "c3", content: "foo", rerankingScore: 0.3, source: "doc2" },
    { id: "c4", content: "bar", relevanceScore: 0.8, source: "doc2" },
  ]
}

describe("applyScoreThreshold", () => {
  it("drops candidates below threshold", () => {
    const trace: SelectionTraceItem[] = []
    const result = applyScoreThreshold(makeCandidates(), 0.6, trace)

    expect(result.kept).toHaveLength(2)
    expect(result.kept.map(c => c.id)).toEqual(["c1", "c4"])
    expect(result.dropped).toHaveLength(2)
    expect(trace.length).toBe(4)
    expect(trace.filter(t => t.action === "dropped")).toHaveLength(2)
  })

  it("keeps candidates without score", () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "no score" },
    ]
    const trace: SelectionTraceItem[] = []
    const result = applyScoreThreshold(candidates, 0.5, trace)
    expect(result.kept).toHaveLength(1)
  })

  it("uses relevanceScore as fallback", () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "a", relevanceScore: 0.4 },
    ]
    const trace: SelectionTraceItem[] = []
    const result = applyScoreThreshold(candidates, 0.5, trace)
    expect(result.dropped).toHaveLength(1)
  })
})

describe("applyBudgetTrim", () => {
  it("trims by maxCandidates", () => {
    const trace: SelectionTraceItem[] = []
    const result = applyBudgetTrim(makeCandidates(), { maxCandidates: 2 }, trace)

    expect(result.kept).toHaveLength(2)
    expect(result.dropped).toHaveLength(2)
    expect(trace.filter(t => t.action === "trimmed")).toHaveLength(2)
  })

  it("trims by maxPromptChars", () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "hello" },   // 5 chars
      { id: "c2", content: "world" },   // 5 chars
      { id: "c3", content: "toolong" }, // 7 chars, exceeds 10
    ]
    const trace: SelectionTraceItem[] = []
    const result = applyBudgetTrim(candidates, { maxPromptChars: 10 }, trace)

    expect(result.kept).toHaveLength(2)
    expect(result.dropped).toHaveLength(1)
  })

  it("keeps all if within budget", () => {
    const trace: SelectionTraceItem[] = []
    const result = applyBudgetTrim(makeCandidates(), { maxCandidates: 100 }, trace)
    expect(result.kept).toHaveLength(4)
    expect(result.dropped).toHaveLength(0)
  })
})

describe("applyNearDuplicateRemoval", () => {
  it("removes candidates with duplicate content", () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "same" },
      { id: "c2", content: "different" },
      { id: "c3", content: "same" },
    ]
    const trace: SelectionTraceItem[] = []
    const result = applyNearDuplicateRemoval(candidates, trace)

    expect(result.kept).toHaveLength(2)
    expect(result.kept.map(c => c.id)).toEqual(["c1", "c2"])
    expect(result.dropped).toHaveLength(1)
    expect(trace.filter(t => t.action === "dropped")).toHaveLength(1)
  })

  it("keeps all when no duplicates", () => {
    const trace: SelectionTraceItem[] = []
    const result = applyNearDuplicateRemoval(makeCandidates(), trace)
    expect(result.kept).toHaveLength(4)
  })
})

describe("applySourceCoverage", () => {
  it("limits candidates per source", () => {
    const trace: SelectionTraceItem[] = []
    const result = applySourceCoverage(makeCandidates(), 1, trace)

    expect(result.kept).toHaveLength(2)
    expect(result.kept.map(c => c.source)).toEqual(["doc1", "doc2"])
    expect(result.dropped).toHaveLength(2)
  })

  it("keeps all if within limit", () => {
    const trace: SelectionTraceItem[] = []
    const result = applySourceCoverage(makeCandidates(), 10, trace)
    expect(result.kept).toHaveLength(4)
  })
})

describe("applyPredicateFilter", () => {
  it("filters by custom predicate", async () => {
    const trace: SelectionTraceItem[] = []
    const result = await applyPredicateFilter(
      makeCandidates(),
      ({ candidate }) => candidate.rerankingScore != null && candidate.rerankingScore > 0.4,
      { originalQuery: "test", effectiveQuery: "test" },
      trace,
    )

    expect(result.kept).toHaveLength(2)
    expect(result.dropped).toHaveLength(2)
    expect(trace.filter(t => t.action === "dropped")).toHaveLength(2)
  })
})

describe("applyContextOrdering", () => {
  it("sorts by comparator", () => {
    const trace: SelectionTraceItem[] = []
    const sorted = applyContextOrdering(
      makeCandidates(),
      (a, b) => (b.rerankingScore ?? 0) - (a.rerankingScore ?? 0),
      trace,
    )

    // c4 has no `rerankingScore`, so rerankingScore ?? 0 = 0, placing it last
    expect(sorted.map(c => c.id)).toEqual(["c1", "c2", "c3", "c4"])
    expect(trace.length).toBe(4)
  })

  it("returns original order if no comparator", () => {
    const trace: SelectionTraceItem[] = []
    const sorted = applyContextOrdering(makeCandidates(), undefined, trace)
    expect(sorted.map(c => c.id)).toEqual(["c1", "c2", "c3", "c4"])
  })
})
