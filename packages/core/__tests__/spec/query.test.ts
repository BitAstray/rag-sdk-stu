import { describe, it, expect } from "vitest"
import { QuerySchema } from "../../src/spec/query.js"

describe("QuerySchema", () => {
  it("accepts a valid query string", () => {
    const result = QuerySchema.parse({ query: "hello" })
    expect(result.query).toBe("hello")
  })

  it("rejects an empty string", () => {
    expect(() => QuerySchema.parse({ query: "" })).toThrow()
  })

  it("rejects a non-string value", () => {
    expect(() => QuerySchema.parse({ query: 123 })).toThrow()
  })

  it("rejects a missing query field", () => {
    expect(() => QuerySchema.parse({})).toThrow()
  })
})
