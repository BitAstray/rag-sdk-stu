import { describe, it, expect } from "vitest"
import { CoreGeneratorWrapper } from "../../src/defaults/generator-wrapper.js"
import { RuntimeError } from "../../src/errors/runtime.js"
import type { Generator } from "@rag-sdk/core"

describe("CoreGeneratorWrapper", () => {
  const context = {
    originalQuery: { query: "test" },
    preprocessed: null,
    chunks: [],
    promptContext: null,
    metadata: {},
  }

  it("delegates to core generator with effectiveQuery and chunks", async () => {
    const coreGenerator: Generator = {
      async generate({ query, chunks }) {
        expect(query.query).toBe("effective")
        expect(chunks).toHaveLength(1)
        return "answer"
      },
    }
    const wrapper = new CoreGeneratorWrapper(coreGenerator)
    const result = await wrapper.generate(
      { originalQuery: "test", effectiveQuery: "effective" },
      [{ id: "c1", content: "chunk" }],
      null,
      context,
    )
    expect(result.answer).toBe("answer")
  })

  it("wraps generation error into RuntimeError with stage='generation'", async () => {
    const coreGenerator: Generator = {
      async generate() {
        throw new Error("LLM down")
      },
    }
    const wrapper = new CoreGeneratorWrapper(coreGenerator)
    try {
      await wrapper.generate(
        { originalQuery: "test", effectiveQuery: "test" },
        [],
        null,
        context,
      )
      expect.fail("should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(RuntimeError)
      expect((e as RuntimeError).stage).toBe("generation")
    }
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
      context,
    )
    expect(result).toEqual({ answer: "generated text" })
    expect(result.debug).toBeUndefined()
  })
})
