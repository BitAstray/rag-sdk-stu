import { describe, it, expect } from "vitest"
import {
  normalizeMetadataValue,
  normalizeMetadata,
  mergeMetadata,
} from "../../src/shared/metadata.js"

describe("normalizeMetadataValue", () => {
  it("passes through string", () => {
    expect(normalizeMetadataValue("hello")).toBe("hello")
  })

  it("passes through number", () => {
    expect(normalizeMetadataValue(42)).toBe(42)
  })

  it("passes through boolean", () => {
    expect(normalizeMetadataValue(true)).toBe(true)
  })

  it("passes through null", () => {
    expect(normalizeMetadataValue(null)).toBe(null)
  })

  it("converts Date to ISO string", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    expect(normalizeMetadataValue(date)).toBe("2024-01-01T00:00:00.000Z")
  })

  it("converts URL to string", () => {
    const url = new URL("https://example.com/path")
    expect(normalizeMetadataValue(url)).toBe("https://example.com/path")
  })

  it("converts bigint to string", () => {
    expect(normalizeMetadataValue(BigInt(123))).toBe("123")
  })

  it("passes through string[]", () => {
    expect(normalizeMetadataValue(["a", "b"])).toEqual(["a", "b"])
  })

  it("converts number[] to string[]", () => {
    expect(normalizeMetadataValue([1, 2, 3])).toEqual(["1", "2", "3"])
  })

  it("converts boolean[] to string[]", () => {
    expect(normalizeMetadataValue([true, false])).toEqual(["true", "false"])
  })

  it("serializes mixed arrays to JSON", () => {
    const result = normalizeMetadataValue([1, "two", true])
    expect(result).toBe('[1,"two",true]')
  })

  it("serializes objects to JSON", () => {
    const result = normalizeMetadataValue({ nested: true })
    expect(result).toBe('{"nested":true}')
  })

  it("returns undefined for undefined input", () => {
    expect(normalizeMetadataValue(undefined)).toBeUndefined()
  })

  it("converts empty array to empty array", () => {
    expect(normalizeMetadataValue([])).toEqual([])
  })
})

describe("normalizeMetadata", () => {
  it("normalizes all values in a record", () => {
    const result = normalizeMetadata({
      name: "test",
      count: 42,
      date: new Date("2024-01-01T00:00:00.000Z"),
      flag: true,
    })
    expect(result).toEqual({
      name: "test",
      count: 42,
      date: "2024-01-01T00:00:00.000Z",
      flag: true,
    })
  })

  it("drops keys with undefined values", () => {
    const result = normalizeMetadata({ a: "keep", b: undefined })
    expect(result).toEqual({ a: "keep" })
    expect(result).not.toHaveProperty("b")
  })
})

describe("mergeMetadata", () => {
  it("merges base and override", () => {
    const result = mergeMetadata({ a: "1" }, { b: "2" })
    expect(result).toEqual({ a: "1", b: "2" })
  })

  it("override wins on conflict", () => {
    const result = mergeMetadata({ a: "base" }, { a: "override" })
    expect(result).toEqual({ a: "override" })
  })

  it("handles undefined base", () => {
    expect(mergeMetadata(undefined, { a: "1" })).toEqual({ a: "1" })
  })

  it("handles undefined override", () => {
    expect(mergeMetadata({ a: "1" }, undefined)).toEqual({ a: "1" })
  })

  it("returns empty object when both undefined", () => {
    expect(mergeMetadata(undefined, undefined)).toEqual({})
  })
})
