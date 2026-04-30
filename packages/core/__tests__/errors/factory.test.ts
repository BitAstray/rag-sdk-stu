import { describe, it, expect } from "vitest"
import { createRagError, RagError } from "../../src/errors/index.js"

describe("createRagError", () => {
  it("returns a RagError with the given code and message", () => {
    const err = createRagError("TEST_CODE", "something failed")
    expect(err).toBeInstanceOf(RagError)
    expect(err.code).toBe("TEST_CODE")
    expect(err.message).toBe("something failed")
  })

  it("preserves cause", () => {
    const cause = new Error("root")
    const err = createRagError("CODE", "msg", cause)
    expect(err.cause).toBe(cause)
  })

  it("handles undefined cause", () => {
    const err = createRagError("CODE", "msg")
    expect(err.cause).toBeUndefined()
  })

  it("sets name to RagError", () => {
    const err = createRagError("CODE", "msg")
    expect(err.name).toBe("RagError")
  })
})
