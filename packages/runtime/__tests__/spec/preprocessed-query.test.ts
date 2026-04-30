import { describe, it, expect } from "vitest"
import { PreprocessedQuerySchema } from "../../src/spec/preprocessed-query.js"

describe("PreprocessedQuerySchema", () => {
  it("accepts minimal valid input", () => {
    const result = PreprocessedQuerySchema.parse({
      originalQuery: "hello",
      effectiveQuery: "hello",
    })
    expect(result.originalQuery).toBe("hello")
    expect(result.effectiveQuery).toBe("hello")
  })

  it("accepts full valid input", () => {
    const result = PreprocessedQuerySchema.parse({
      originalQuery: "hello",
      effectiveQuery: "hello world",
      topK: 5,
      filters: { source: "docs" },
      strategy: "semantic",
      route: "knowledge-base",
      rewriteReason: "expanded query",
    })
    expect(result.topK).toBe(5)
    expect(result.strategy).toBe("semantic")
  })

  it("rejects empty originalQuery", () => {
    expect(() =>
      PreprocessedQuerySchema.parse({
        originalQuery: "",
        effectiveQuery: "hello",
      }),
    ).toThrow()
  })

  it("rejects empty effectiveQuery", () => {
    expect(() =>
      PreprocessedQuerySchema.parse({
        originalQuery: "hello",
        effectiveQuery: "",
      }),
    ).toThrow()
  })

  it("rejects missing originalQuery", () => {
    expect(() =>
      PreprocessedQuerySchema.parse({ effectiveQuery: "hello" }),
    ).toThrow()
  })

  it("rejects missing effectiveQuery", () => {
    expect(() =>
      PreprocessedQuerySchema.parse({ originalQuery: "hello" }),
    ).toThrow()
  })
})
