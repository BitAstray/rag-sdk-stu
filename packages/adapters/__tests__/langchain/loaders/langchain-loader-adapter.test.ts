import { describe, it, expect, vi } from "vitest"
import { LangChainLoaderAdapter } from "../../../src/langchain/loaders/langchain-loader-adapter.js"

function createMockLcLoader(
  docs: { pageContent: string; metadata?: Record<string, unknown>; id?: string }[],
) {
  return { load: vi.fn(async () => docs) }
}

describe("LangChainLoaderAdapter", () => {
  it("loads and maps LC docs with ids", async () => {
    const loader = new LangChainLoaderAdapter({
      lcLoader: createMockLcLoader([
        { pageContent: "doc 1", metadata: { source: "a" }, id: "lc-1" },
        { pageContent: "doc 2", metadata: { source: "b" }, id: "lc-2" },
      ]),
    })

    const docs = await loader.load()
    expect(docs).toHaveLength(2)
    expect(docs[0].id).toBe("lc-1")
    expect(docs[0].content).toBe("doc 1")
    expect(docs[1].id).toBe("lc-2")
  })

  it("generates fallback id when LC doc has no id", async () => {
    const loader = new LangChainLoaderAdapter({
      lcLoader: createMockLcLoader([{ pageContent: "no id doc" }]),
    })

    const docs = await loader.load()
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBeDefined()
    expect(docs[0].id).toContain("::0")
  })

  it("normalizes metadata", async () => {
    const loader = new LangChainLoaderAdapter({
      lcLoader: createMockLcLoader([
        {
          pageContent: "test",
          metadata: { date: new Date("2024-01-01T00:00:00.000Z"), count: 42 },
          id: "1",
        },
      ]),
    })

    const docs = await loader.load()
    expect(docs[0].metadata?.date).toBe("2024-01-01T00:00:00.000Z")
    expect(docs[0].metadata?.count).toBe(42)
  })

  it("returns empty array for empty load", async () => {
    const loader = new LangChainLoaderAdapter({
      lcLoader: createMockLcLoader([]),
    })

    const docs = await loader.load()
    expect(docs).toEqual([])
  })

  it("passes through string/boolean/null metadata", async () => {
    const loader = new LangChainLoaderAdapter({
      lcLoader: createMockLcLoader([
        {
          pageContent: "test",
          metadata: { name: "hello", active: true, value: null },
          id: "1",
        },
      ]),
    })

    const docs = await loader.load()
    expect(docs[0].metadata?.name).toBe("hello")
    expect(docs[0].metadata?.active).toBe(true)
    expect(docs[0].metadata?.value).toBe(null)
  })
})
