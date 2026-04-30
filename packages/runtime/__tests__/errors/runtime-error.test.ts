import { describe, it, expect } from "vitest"
import { RuntimeError } from "../../src/errors/runtime.js"
import { RagError } from "@rag-sdk/core"

describe("RuntimeError", () => {
  it("has code 'RUNTIME_ERROR'", () => {
    const error = new RuntimeError("retrieval", "test error")
    expect(error.code).toBe("RUNTIME_ERROR")
  })

  it("preserves stage field", () => {
    const error = new RuntimeError("pre-retrieval", "test")
    expect(error.stage).toBe("pre-retrieval")
  })

  it("is instance of RagError and Error", () => {
    const error = new RuntimeError("generation", "test")
    expect(error).toBeInstanceOf(RuntimeError)
    expect(error).toBeInstanceOf(RagError)
    expect(error).toBeInstanceOf(Error)
  })

  it("preserves cause", () => {
    const cause = new Error("root cause")
    const error = new RuntimeError("retrieval", "wrapper", cause)
    expect(error.cause).toBe(cause)
  })

  it("accepts all valid RuntimeStage values", () => {
    const stages = ["pre-retrieval", "retrieval", "post-retrieval", "generation"] as const
    for (const stage of stages) {
      const error = new RuntimeError(stage, "test")
      expect(error.stage).toBe(stage)
    }
  })

  it("has correct name property", () => {
    const error = new RuntimeError("retrieval", "test")
    expect(error.name).toBe("RuntimeError")
  })
})
