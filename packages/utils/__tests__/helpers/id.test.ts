import { describe, it, expect } from "vitest"
import { createId, createTraceId } from "../../src/helpers/id.js"

describe("createId", () => {
  it("uses 'id' as default prefix", () => {
    const id = createId()
    expect(id).toMatch(/^id-\d+-[a-z0-9]+$/)
  })

  it("accepts a custom prefix", () => {
    const id = createId("trace")
    expect(id).toMatch(/^trace-\d+-[a-z0-9]+$/)
  })

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()))
    expect(ids.size).toBe(100)
  })
})

describe("createTraceId", () => {
  it("creates a trace-prefixed ID", () => {
    const id = createTraceId()
    expect(id).toMatch(/^trace-\d+-[a-z0-9]+$/)
  })
})
