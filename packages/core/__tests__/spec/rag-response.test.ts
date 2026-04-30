import { describe, it, expect } from "vitest"
import { RAGResponseSchema } from "../../src/spec/rag-response.js"

describe("RAGResponseSchema", () => {
  it("accepts a valid response with answer and chunks", () => {
    const result = RAGResponseSchema.parse({
      answer: "42",
      chunks: [{ id: "1", content: "meaning of life" }],
    })
    expect(result.answer).toBe("42")
    expect(result.chunks).toHaveLength(1)
  })

  it("accepts an empty chunks array", () => {
    const result = RAGResponseSchema.parse({ answer: "nothing found", chunks: [] })
    expect(result.chunks).toEqual([])
  })

  it("rejects chunks with invalid elements", () => {
    expect(() =>
      RAGResponseSchema.parse({ answer: "x", chunks: [{ id: 123 }] }),
    ).toThrow()
  })

  it("rejects a missing answer", () => {
    expect(() =>
      RAGResponseSchema.parse({ chunks: [{ id: "1", content: "c" }] }),
    ).toThrow()
  })
})
