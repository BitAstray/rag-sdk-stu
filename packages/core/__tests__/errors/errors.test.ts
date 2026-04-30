import { describe, it, expect } from "vitest"
import {
  RagError,
  ValidationError,
  RetrievalError,
  GenerationError,
} from "../../src/errors/index.js"

describe("Error classes", () => {
  describe("RagError", () => {
    it("preserves message, code, and cause", () => {
      const cause = new Error("root cause")
      const err = new RagError("something broke", "GENERIC", cause)
      expect(err.message).toBe("something broke")
      expect(err.code).toBe("GENERIC")
      expect(err.cause).toBe(cause)
    })

    it("sets name to the class name", () => {
      const err = new RagError("msg", "CODE")
      expect(err.name).toBe("RagError")
    })

    it("is an instance of Error", () => {
      expect(new RagError("msg", "CODE")).toBeInstanceOf(Error)
    })

    it("handles undefined cause", () => {
      const err = new RagError("msg", "CODE")
      expect(err.cause).toBeUndefined()
    })
  })

  describe("ValidationError", () => {
    it('has code "VALIDATION_ERROR"', () => {
      const err = new ValidationError("bad input")
      expect(err.code).toBe("VALIDATION_ERROR")
      expect(err.name).toBe("ValidationError")
    })

    it("is an instance of RagError and Error", () => {
      const err = new ValidationError("bad input")
      expect(err).toBeInstanceOf(RagError)
      expect(err).toBeInstanceOf(Error)
    })

    it("preserves cause", () => {
      const cause = new Error("zod fail")
      const err = new ValidationError("bad input", cause)
      expect(err.cause).toBe(cause)
    })
  })

  describe("RetrievalError", () => {
    it('has code "RETRIEVAL_ERROR"', () => {
      const err = new RetrievalError("search failed")
      expect(err.code).toBe("RETRIEVAL_ERROR")
      expect(err.name).toBe("RetrievalError")
    })
  })

  describe("GenerationError", () => {
    it('has code "GENERATION_ERROR"', () => {
      const err = new GenerationError("llm timeout")
      expect(err.code).toBe("GENERATION_ERROR")
      expect(err.name).toBe("GenerationError")
    })
  })
})
