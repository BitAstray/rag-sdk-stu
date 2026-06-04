import { describe, it, expect } from "vitest"
import type { Query, RAGResponse } from "@rag-sdk/core"
import { Runner, summarize } from "../../src/runner/index.js"
import { HeuristicJudge } from "../../src/judges/index.js"
import type { EvalDataset } from "../../src/types/dataset.js"
import type { EvalResult } from "../../src/types/result.js"

const dataset: EvalDataset = {
  id: "d1",
  name: "test",
  version: "v1",
  samples: [
    { id: "s1", query: "vacation?", expectedAnswer: "15", expectedChunks: ["c1"] },
    { id: "s2", query: "remote?", expectedAnswer: "3", expectedChunks: ["c2"] },
  ],
}

const pipeline = async (query: Query): Promise<RAGResponse> => {
  if (query.query.includes("vacation")) {
    return { answer: "15 days", chunks: [{ id: "c1", content: "15 days vacation" }] }
  }
  return { answer: "3 days", chunks: [{ id: "c2", content: "3 days remote" }] }
}

describe("Runner", () => {
  it("evaluates every sample and summarizes", async () => {
    const runner = new Runner({ metrics: ["recall@5", "answer_presence"] })
    const result = await runner.run(dataset, pipeline)

    expect(result.datasetId).toBe("d1")
    expect(result.results).toHaveLength(2)
    expect(result.summary.totalSamples).toBe(2)
    // both samples hit their expected chunk & answer → mean 1
    expect(result.summary.scores["recall@5"].mean).toBe(1)
    expect(result.summary.scores["answer_presence"].mean).toBe(1)
  })

  it("includes judge scores namespaced by judge name", async () => {
    const runner = new Runner({ metrics: ["mrr"], judges: [new HeuristicJudge()] })
    const result = await runner.run(dataset, pipeline)

    expect(result.results[0].scores).toHaveProperty("heuristic.faithfulness")
    expect(result.results[0].scores["heuristic.faithfulness"]).toBe(1)
  })

  it("uses default metrics when none specified", async () => {
    const runner = new Runner()
    const result = await runner.run(dataset, pipeline)
    expect(Object.keys(result.summary.scores)).toContain("mrr")
  })

  it("propagates unknown metric error", () => {
    expect(() => new Runner({ metrics: ["bogus"] })).toThrow("Unknown metric")
  })
})

describe("summarize", () => {
  it("computes mean/min/max/std per metric", () => {
    const results: EvalResult[] = [
      { datasetId: "d", datasetVersion: "v", traceId: "t1", sampleId: "s1", scores: { m: 0 } },
      { datasetId: "d", datasetVersion: "v", traceId: "t2", sampleId: "s2", scores: { m: 1 } },
    ]
    const summary = summarize(results)
    expect(summary.scores.m.mean).toBe(0.5)
    expect(summary.scores.m.min).toBe(0)
    expect(summary.scores.m.max).toBe(1)
    expect(summary.scores.m.std).toBe(0.5)
  })

  it("handles empty results", () => {
    const summary = summarize([])
    expect(summary.totalSamples).toBe(0)
    expect(summary.scores).toEqual({})
  })
})
