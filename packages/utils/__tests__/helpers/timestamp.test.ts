import { describe, it, expect } from "vitest"
import { createTimestamp } from "../../src/helpers/timestamp.js"

describe("createTimestamp", () => {
  it("returns a valid ISO 8601 string", () => {
    const ts = createTimestamp()
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it("returns a date that parses to a valid Date", () => {
    const ts = createTimestamp()
    const date = new Date(ts)
    expect(date.getTime()).not.toBeNaN()
  })

  it("returns timestamps that are monotonically non-decreasing", () => {
    const ts1 = createTimestamp()
    const ts2 = createTimestamp()
    expect(ts2 >= ts1).toBe(true)
  })
})
