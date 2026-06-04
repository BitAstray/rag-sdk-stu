import { describe, it, expect } from "vitest"
import type { RAGResponse } from "@rag-sdk/core"
import { HeuristicJudge } from "../../src/judges/index.js"

const judge = new HeuristicJudge()
const sample = { id: "s1", query: "q" }

describe("HeuristicJudge", () => {
  it("scores faithfulness 1 when answer and chunks present", () => {
    const output: RAGResponse = {
      answer: "vacation is 15 days",
      chunks: [{ id: "c1", content: "vacation is 15 days per year" }],
    }
    const scores = judge.judge(sample, output)
    expect(scores.faithfulness).toBe(1)
    expect(scores.groundedness).toBeGreaterThan(0)
  })

  it("scores faithfulness 0 when no chunks", () => {
    const output: RAGResponse = { answer: "something", chunks: [] }
    expect(judge.judge(sample, output).faithfulness).toBe(0)
  })

  it("scores groundedness 0 when answer empty", () => {
    const output: RAGResponse = { answer: "", chunks: [{ id: "c1", content: "x" }] }
    expect(judge.judge(sample, output).groundedness).toBe(0)
  })

  it("computes groundedness as token overlap ratio", () => {
    const output: RAGResponse = {
      answer: "alpha beta",
      chunks: [{ id: "c1", content: "alpha gamma" }],
    }
    // "alpha" grounded, "beta" not → 0.5
    expect(judge.judge(sample, output).groundedness).toBe(0.5)
  })
})
