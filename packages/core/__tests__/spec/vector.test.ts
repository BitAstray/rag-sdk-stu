import { describe, it, expect } from "vitest"
import { VectorSchema } from "../../src/spec/vector.js"

describe("VectorSchema", () => {
  it("accepts a valid vector with id and values", () => {
    const result = VectorSchema.parse({ id: "v1", values: [0.1, 0.2, 0.3] })
    expect(result.id).toBe("v1")
    expect(result.values).toHaveLength(3)
  })

  it("accepts a vector with metadata", () => {
    const result = VectorSchema.parse({
      id: "v1",
      values: [1, 0, 0],
      metadata: { chunkId: "c1" },
    })
    expect(result.metadata?.chunkId).toBe("c1")
  })

  it("rejects non-number values", () => {
    expect(() =>
      VectorSchema.parse({ id: "v1", values: ["a", "b"] }),
    ).toThrow()
  })

  it("rejects a missing id", () => {
    expect(() => VectorSchema.parse({ values: [1, 2, 3] })).toThrow()
  })
})
