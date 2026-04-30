import { describe, it, expect } from "vitest"
import { NoopQueryPreprocessor } from "../../src/defaults/noop-query-preprocessor.js"

describe("NoopQueryPreprocessor", () => {
  it("passes query through unchanged", async () => {
    const preprocessor = new NoopQueryPreprocessor()
    const result = await preprocessor.preprocess({ query: "hello world" })
    expect(result.effectiveQuery).toBe("hello world")
  })

  it("sets originalQuery and effectiveQuery to the same value", async () => {
    const preprocessor = new NoopQueryPreprocessor()
    const result = await preprocessor.preprocess({ query: "test" })
    expect(result.originalQuery).toBe("test")
    expect(result.effectiveQuery).toBe("test")
  })

  it("does not set optional fields", async () => {
    const preprocessor = new NoopQueryPreprocessor()
    const result = await preprocessor.preprocess({ query: "test" })
    expect(result.topK).toBeUndefined()
    expect(result.filters).toBeUndefined()
    expect(result.strategy).toBeUndefined()
    expect(result.route).toBeUndefined()
    expect(result.rewriteReason).toBeUndefined()
  })
})
