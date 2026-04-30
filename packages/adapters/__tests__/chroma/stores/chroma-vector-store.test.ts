import { describe, it, expect, vi } from "vitest"
import { ChromaVectorStore } from "../../../src/chroma/stores/chroma-vector-store.js"

function createMockCollection() {
  return {
    upsert: vi.fn(async (): Promise<void> => {}),
  }
}

function createMockClient(collection = createMockCollection()) {
  return {
    getOrCreateCollection: vi.fn(async () => collection),
    _collection: collection,
  }
}

describe("ChromaVectorStore", () => {
  it("throws when collectionName is empty", () => {
    const client = createMockClient()
    expect(
      () => new ChromaVectorStore({ collectionName: "", client: client as never }),
    ).toThrow("collectionName is required")
  })

  it("throws when client is not provided", () => {
    expect(
      () => new ChromaVectorStore({ collectionName: "test" }),
    ).toThrow("client is required")
  })

  it("short-circuits on empty input", async () => {
    const client = createMockClient()
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await store.upsert([])

    expect(client.getOrCreateCollection).not.toHaveBeenCalled()
  })

  it("creates collection lazily on first upsert", async () => {
    const client = createMockClient()
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await store.upsert([{ id: "v1", values: [0.1, 0.2] }])

    expect(client.getOrCreateCollection).toHaveBeenCalledTimes(1)
    expect(client.getOrCreateCollection).toHaveBeenCalledWith({
      name: "test",
      metadata: undefined,
    })
  })

  it("reuses collection on subsequent upserts", async () => {
    const client = createMockClient()
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await store.upsert([{ id: "v1", values: [0.1] }])
    await store.upsert([{ id: "v2", values: [0.2] }])

    expect(client.getOrCreateCollection).toHaveBeenCalledTimes(1)
  })

  it("passes correct data to collection.upsert", async () => {
    const collection = createMockCollection()
    const client = createMockClient(collection)
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await store.upsert([
      { id: "v1", values: [0.1, 0.2], metadata: { name: "test", count: 42 } },
      { id: "v2", values: [0.3, 0.4], metadata: { active: true } },
    ])

    expect(collection.upsert).toHaveBeenCalledWith({
      ids: ["v1", "v2"],
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      metadatas: [
        { name: "test", count: 42 },
        { active: true },
      ],
    })
  })

  it("throws on dimension mismatch", async () => {
    const client = createMockClient()
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await expect(
      store.upsert([
        { id: "v1", values: [0.1, 0.2] },
        { id: "v2", values: [0.3, 0.4, 0.5] },
      ]),
    ).rejects.toThrow("Dimension mismatch: expected 2, got 3 for vector v2")
  })

  it("propagates collection creation error", async () => {
    const client = createMockClient()
    client.getOrCreateCollection.mockRejectedValueOnce(
      new Error("Connection refused"),
    )
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await expect(
      store.upsert([{ id: "v1", values: [0.1] }]),
    ).rejects.toThrow("Connection refused")
  })

  it("retries collection creation after failure", async () => {
    const collection = createMockCollection()
    const client = createMockClient()
    client.getOrCreateCollection
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce(collection)

    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await expect(
      store.upsert([{ id: "v1", values: [0.1] }]),
    ).rejects.toThrow("Temporary failure")

    // Second attempt should succeed
    await store.upsert([{ id: "v2", values: [0.2] }])
    expect(client.getOrCreateCollection).toHaveBeenCalledTimes(2)
  })

  it("passes collectionMetadata to getOrCreateCollection", async () => {
    const client = createMockClient()
    const store = new ChromaVectorStore({
      collectionName: "test",
      collectionMetadata: { "hnsw:space": "cosine" },
      client: client as never,
    })

    await store.upsert([{ id: "v1", values: [0.1] }])

    expect(client.getOrCreateCollection).toHaveBeenCalledWith({
      name: "test",
      metadata: { "hnsw:space": "cosine" },
    })
  })

  it("converts undefined metadata to null in metadatas", async () => {
    const collection = createMockCollection()
    const client = createMockClient(collection)
    const store = new ChromaVectorStore({ collectionName: "test", client: client as never })

    await store.upsert([{ id: "v1", values: [0.1] }])

    expect(collection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadatas: [null],
      }),
    )
  })
})
