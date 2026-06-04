import { describe, it, expect } from "vitest"
import type { RAGResponse } from "@rag-sdk/core"
import type { EvalSample } from "../../src/types/dataset.js"
import {
  RecallAtK,
  ReciprocalRank,
  AnswerPresence,
  resolveMetrics,
  defaultMetrics,
} from "../../src/metrics/index.js"

const sample = (overrides: Partial<EvalSample> = {}): EvalSample => ({
  id: "s1",
  query: "q",
  expectedChunks: ["a", "b"],
  ...overrides,
})

const response = (ids: string[], answer = "ans"): RAGResponse => ({
  answer,
  chunks: ids.map((id) => ({ id, content: id })),
})

describe("RecallAtK", () => {
  it("scores fraction of expected chunks retrieved", () => {
    expect(new RecallAtK(5).evaluate(sample(), response(["a", "x"]))).toBe(0.5)
  })

  it("returns 1 when all expected retrieved", () => {
    expect(new RecallAtK(5).evaluate(sample(), response(["a", "b"]))).toBe(1)
  })

  it("respects K cutoff", () => {
    expect(new RecallAtK(1).evaluate(sample(), response(["x", "a", "b"]))).toBe(0)
  })

  it("returns 1 when no expected chunks", () => {
    expect(new RecallAtK(5).evaluate(sample({ expectedChunks: [] }), response([]))).toBe(1)
  })
})

describe("ReciprocalRank", () => {
  it("returns reciprocal of first hit rank", () => {
    expect(new ReciprocalRank().evaluate(sample(), response(["x", "a"]))).toBe(0.5)
  })

  it("returns 1 for first-position hit", () => {
    expect(new ReciprocalRank().evaluate(sample(), response(["a"]))).toBe(1)
  })

  it("returns 0 when no hit", () => {
    expect(new ReciprocalRank().evaluate(sample(), response(["x", "y"]))).toBe(0)
  })
})

describe("AnswerPresence", () => {
  it("detects expected answer substring case-insensitively", () => {
    const s = sample({ expectedAnswer: "15 days" })
    expect(new AnswerPresence().evaluate(s, response([], "It is 15 DAYS total"))).toBe(1)
  })

  it("returns 0 when missing", () => {
    const s = sample({ expectedAnswer: "15 days" })
    expect(new AnswerPresence().evaluate(s, response([], "no idea"))).toBe(0)
  })

  it("returns 1 when no expected answer", () => {
    expect(new AnswerPresence().evaluate(sample(), response([], ""))).toBe(1)
  })
})

describe("resolveMetrics", () => {
  it("resolves by name", () => {
    const metrics = resolveMetrics(["mrr", "recall@5"])
    expect(metrics.map((m) => m.name)).toEqual(["mrr", "recall@5"])
  })

  it("throws on unknown metric", () => {
    expect(() => resolveMetrics(["nope"])).toThrow("Unknown metric")
  })

  it("default registry exposes three metrics", () => {
    expect(defaultMetrics().map((m) => m.name)).toEqual(["recall@5", "mrr", "answer_presence"])
  })
})
