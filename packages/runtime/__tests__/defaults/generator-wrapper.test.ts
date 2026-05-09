import { describe, it, expect } from "vitest"
import { CoreGeneratorWrapper } from "../../src/defaults/generator-wrapper.js"
import type { Generator } from "@rag-sdk/core"
import type { RetrievalCandidate } from "../../src/spec/retrieval-candidate.js"

describe("CoreGeneratorWrapper", () => {
  it("delegates to core generator with effectiveQuery and converts candidates to chunks", async () => {
    const coreGenerator: Generator = {
      async generate({ query, chunks }) {
        expect(query.query).toBe("effective")
        expect(chunks).toHaveLength(1)
        return "answer"
      },
    }
    const wrapper = new CoreGeneratorWrapper(coreGenerator)
    const candidates: RetrievalCandidate[] = [{ id: "c1", content: "chunk" }]
    const result = await wrapper.generate(
      { originalQuery: "test", effectiveQuery: "effective" },
      candidates,
      null,
    )
    expect(result.answer).toBe("answer")
  })

  it("propagates core generator errors", async () => {
    const coreGenerator: Generator = {
      async generate() {
        throw new Error("LLM down")
      },
    }
    const wrapper = new CoreGeneratorWrapper(coreGenerator)
    await expect(
      wrapper.generate(
        { originalQuery: "test", effectiveQuery: "test" },
        [],
        null,
      ),
    ).rejects.toThrow("LLM down")
  })

  it("returns answer in RuntimeGeneratorResult shape", async () => {
    const coreGenerator: Generator = {
      async generate() {
        return "generated text"
      },
    }
    const wrapper = new CoreGeneratorWrapper(coreGenerator)
    const result = await wrapper.generate(
      { originalQuery: "test", effectiveQuery: "test" },
      [],
      null,
    )
    expect(result).toEqual({ answer: "generated text" })
    expect(result.debug).toBeUndefined()
  })
})
