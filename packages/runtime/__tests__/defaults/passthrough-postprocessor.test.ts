import { describe, it, expect } from "vitest"
import { PassthroughRetrievalPostprocessor } from "../../src/defaults/passthrough-postprocessor.js"
import type { RetrievalCandidate } from "../../src/spec/retrieval-candidate.js"

describe("PassthroughRetrievalPostprocessor", () => {
  const postprocessor = new PassthroughRetrievalPostprocessor()
  const query = { originalQuery: "test", effectiveQuery: "test" }

  it("returns candidates unchanged", async () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "hello" },
      { id: "c2", content: "world" },
    ]
    const result = await postprocessor.postprocess(query, candidates)
    expect(result.candidates).toEqual(candidates)
  })

  it("returns promptContext as null", async () => {
    const result = await postprocessor.postprocess(query, [])
    expect(result.promptContext).toBeNull()
  })

  it("preserves candidate order", async () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "first" },
      { id: "c2", content: "second" },
      { id: "c3", content: "third" },
    ]
    const result = await postprocessor.postprocess(query, candidates)
    expect(result.candidates.map((c) => c.id)).toEqual(["c1", "c2", "c3"])
  })

  it("handles empty candidates array", async () => {
    const result = await postprocessor.postprocess(query, [])
    expect(result.candidates).toEqual([])
    expect(result.promptContext).toBeNull()
  })

  it("returns no detail", async () => {
    const candidates: RetrievalCandidate[] = [
      { id: "c1", content: "hello" },
    ]
    const result = await postprocessor.postprocess(query, candidates)
    expect(result.detail).toBeUndefined()
  })
})
