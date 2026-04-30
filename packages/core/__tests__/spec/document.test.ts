import { describe, it, expect } from "vitest"
import { DocumentSchema } from "../../src/spec/document.js"

describe("DocumentSchema", () => {
  it("accepts a minimal document with id and content", () => {
    const result = DocumentSchema.parse({ id: "doc-1", content: "hello world" })
    expect(result.id).toBe("doc-1")
    expect(result.content).toBe("hello world")
  })

  it("accepts a document with metadata", () => {
    const result = DocumentSchema.parse({
      id: "doc-1",
      content: "hello",
      metadata: { source: "file.txt", tags: ["ai", "rag"] },
    })
    expect(result.metadata?.source).toBe("file.txt")
    expect(result.metadata?.tags).toEqual(["ai", "rag"])
  })

  it("rejects a missing id", () => {
    expect(() => DocumentSchema.parse({ content: "hello" })).toThrow()
  })

  it("rejects a missing content", () => {
    expect(() => DocumentSchema.parse({ id: "1" })).toThrow()
  })
})
