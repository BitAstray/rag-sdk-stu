import { describe, it, expect } from "vitest"
import { generateFallbackId } from "../../../src/langchain/shared/id.js"

describe("generateFallbackId", () => {
  it("produces deterministic output for same input", () => {
    const id1 = generateFallbackId("hello world", 0)
    const id2 = generateFallbackId("hello world", 0)
    expect(id1).toBe(id2)
  })

  it("produces different ids for different content", () => {
    const id1 = generateFallbackId("hello", 0)
    const id2 = generateFallbackId("world", 0)
    expect(id1).not.toBe(id2)
  })

  it("produces different ids for different indices", () => {
    const id1 = generateFallbackId("hello", 0)
    const id2 = generateFallbackId("hello", 1)
    expect(id1).not.toBe(id2)
  })

  it("includes index in id", () => {
    const id = generateFallbackId("test", 5)
    expect(id).toContain("::5")
  })

  it("hash prefix is 16 hex chars", () => {
    const id = generateFallbackId("test", 0)
    const hash = id.split("::")[0]
    expect(hash).toHaveLength(16)
    expect(/^[0-9a-f]{16}$/.test(hash)).toBe(true)
  })
})
