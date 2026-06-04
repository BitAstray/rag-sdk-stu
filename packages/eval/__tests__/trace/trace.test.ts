import { describe, it, expect } from "vitest"
import type { RAGTrace } from "@rag-sdk/observability"
import { extractQualitySignals, extractEvalSample } from "../../src/trace/index.js"

const baseTrace = (overrides: Partial<RAGTrace> = {}): RAGTrace => ({
  traceId: "t1",
  scope: "runtime",
  startedAt: "2026-01-01T00:00:00.000Z",
  status: "ok",
  events: [],
  ...overrides,
})

describe("extractQualitySignals", () => {
  it("flags empty retrieval", () => {
    const trace = baseTrace({
      events: [
        { traceId: "t1", scope: "runtime", stage: "retrieval", name: "runtime.retrieval.complete", timestamp: "x", attributes: { candidateCount: 0 } },
      ],
    })
    expect(extractQualitySignals(trace).emptyRetrieval).toBe(true)
  })

  it("flags low confidence below threshold", () => {
    const trace = baseTrace({
      events: [
        { traceId: "t1", scope: "runtime", stage: "retrieval", name: "runtime.retrieval.complete", timestamp: "x", attributes: { candidateCount: 3, topScore: 0.2 } },
      ],
    })
    expect(extractQualitySignals(trace).lowConfidence).toBe(true)
  })

  it("flags high drop rate", () => {
    const trace = baseTrace({
      events: [
        { traceId: "t1", scope: "runtime", stage: "retrieval", name: "runtime.retrieval.complete", timestamp: "x", attributes: { candidateCount: 10 } },
        { traceId: "t1", scope: "runtime", stage: "post_retrieval", name: "runtime.post_retrieval.select", timestamp: "x", attributes: { selectedCount: 2, droppedCount: 8 } },
      ],
    })
    expect(extractQualitySignals(trace).highDropRate).toBe(true)
  })

  it("flags error from trace status", () => {
    expect(extractQualitySignals(baseTrace({ status: "error" })).errorOccurred).toBe(true)
  })
})

describe("extractEvalSample", () => {
  it("pulls query and answer from events", () => {
    const trace = baseTrace({
      sampleId: "s1",
      dataset: "d1",
      version: "v1",
      events: [
        { traceId: "t1", scope: "runtime", stage: "query", name: "runtime.query.receive", timestamp: "x", attributes: { query: "hello?" } },
        { traceId: "t1", scope: "runtime", stage: "generation", name: "runtime.generation.complete", timestamp: "x", attributes: { answer: "hi" } },
      ],
    })
    const s = extractEvalSample(trace)
    expect(s.query).toBe("hello?")
    expect(s.answer).toBe("hi")
    expect(s.sampleId).toBe("s1")
    expect(s.dataset).toBe("d1")
  })

  it("defaults query to empty string when absent", () => {
    expect(extractEvalSample(baseTrace()).query).toBe("")
  })
})
