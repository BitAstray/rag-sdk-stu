import { describe, it, expect } from "vitest"
import { safeStringify, toSerializable } from "../../src/helpers/safe-json.js"

describe("safeStringify", () => {
  it("serializes plain objects", () => {
    expect(safeStringify({ a: 1 })).toBe('{"a":1}')
  })

  it("handles circular references by returning String(value)", () => {
    const obj: any = {}
    obj.self = obj
    const result = safeStringify(obj)
    expect(result).toBe("[object Object]")
  })

  it("respects space parameter", () => {
    const result = safeStringify({ a: 1 }, 2)
    expect(result).toContain("\n")
  })
})

describe("toSerializable", () => {
  it("converts Date to ISO string", () => {
    const date = new Date("2025-01-01T00:00:00Z")
    expect(toSerializable(date)).toBe("2025-01-01T00:00:00.000Z")
  })

  it("converts Error to plain object", () => {
    const err = new Error("test")
    const result = toSerializable(err) as any
    expect(result.name).toBe("Error")
    expect(result.message).toBe("test")
    expect(result.stack).toBeDefined()
  })

  it("returns undefined for functions", () => {
    expect(toSerializable(() => {})).toBeUndefined()
  })

  it("passes through primitives unchanged", () => {
    expect(toSerializable(42)).toBe(42)
    expect(toSerializable("hello")).toBe("hello")
    expect(toSerializable(null)).toBeNull()
  })
})
