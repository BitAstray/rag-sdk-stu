import { describe, it, expect } from "vitest"
import { MemoryVectorStore } from "../../src/stores/memory-vector-store.js"
import type { Vector } from "@rag-sdk/core"

describe("MemoryVectorStore", () => {
  it("stores and retrieves vectors", async () => {
    const store = new MemoryVectorStore()
    const vectors: Vector[] = [
      { id: "v1", values: [1, 0, 0] },
      { id: "v2", values: [0, 1, 0] },
    ]
    await store.upsert(vectors)
    expect(store.getAll()).toHaveLength(2)
  })

  it("upsert replaces existing vector with same id", async () => {
    const store = new MemoryVectorStore()
    await store.upsert([{ id: "v1", values: [1, 0, 0] }])
    await store.upsert([{ id: "v1", values: [0, 1, 0] }])
    expect(store.getAll()).toHaveLength(1)
    expect(store.getAll()[0].values).toEqual([0, 1, 0])
  })

  it("handles empty upsert", async () => {
    const store = new MemoryVectorStore()
    await store.upsert([])
    expect(store.getAll()).toHaveLength(0)
  })

  it("preserves vector metadata", async () => {
    const store = new MemoryVectorStore()
    await store.upsert([
      { id: "v1", values: [1], metadata: { source: "test" } },
    ])
    expect(store.getAll()[0].metadata?.source).toBe("test")
  })
})
