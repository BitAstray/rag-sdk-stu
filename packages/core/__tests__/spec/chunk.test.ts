import { describe, it, expect } from "vitest"
import { ChunkSchema } from "../../src/spec/chunk.js"

describe("ChunkSchema", () => {
  it("accepts a minimal chunk with id and content", () => {
    const result = ChunkSchema.parse({ id: "1", content: "hello" })
    expect(result.id).toBe("1")
    expect(result.content).toBe("hello")
  })

  it("accepts a chunk with metadata containing primitives", () => {
    const result = ChunkSchema.parse({
      id: "1",
      content: "hello",
      metadata: { key: "value", count: 42, active: true, empty: null },
    })
    expect(result.metadata).toEqual({ key: "value", count: 42, active: true, empty: null })
  })

  it("accepts metadata with string[] arrays (tags)", () => {
    const result = ChunkSchema.parse({
      id: "1",
      content: "hello",
      metadata: { tags: ["a", "b", "c"] },
    })
    expect(result.metadata?.tags).toEqual(["a", "b", "c"])
  })

  it("rejects metadata with nested objects", () => {
    expect(() =>
      ChunkSchema.parse({
        id: "1",
        content: "hello",
        metadata: { nested: { key: "value" } },
      }),
    ).toThrow()
  })

  it("rejects a missing id", () => {
    expect(() => ChunkSchema.parse({ content: "hello" })).toThrow()
  })

  it("rejects a missing content", () => {
    expect(() => ChunkSchema.parse({ id: "1" })).toThrow()
  })
})
