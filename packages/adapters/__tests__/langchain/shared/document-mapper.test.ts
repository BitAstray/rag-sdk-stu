import { describe, it, expect } from "vitest"
import {
  lcDocumentToDocument,
  documentToLcDocument,
} from "../../../src/langchain/shared/document-mapper.js"

describe("lcDocumentToDocument", () => {
  it("converts LC doc with id", () => {
    const result = lcDocumentToDocument(
      { pageContent: "hello", metadata: { source: "test" }, id: "doc-1" },
      0,
    )
    expect(result.id).toBe("doc-1")
    expect(result.content).toBe("hello")
    expect(result.metadata).toEqual({ source: "test" })
  })

  it("generates fallback id when LC doc has no id", () => {
    const result = lcDocumentToDocument({ pageContent: "hello" }, 0)
    expect(result.id).toBeDefined()
    expect(result.id).toContain("::0")
  })

  it("normalizes metadata", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    const result = lcDocumentToDocument(
      { pageContent: "test", metadata: { date, count: 42 } },
      0,
    )
    expect(result.metadata?.date).toBe("2024-01-01T00:00:00.000Z")
    expect(result.metadata?.count).toBe(42)
  })

  it("handles missing metadata", () => {
    const result = lcDocumentToDocument({ pageContent: "test" }, 0)
    expect(result.metadata).toEqual({})
  })
})

describe("documentToLcDocument", () => {
  it("converts internal doc to LC shape", () => {
    const result = documentToLcDocument({
      id: "doc-1",
      content: "hello",
      metadata: { source: "test" },
    })
    expect(result.pageContent).toBe("hello")
    expect(result.metadata).toEqual({ source: "test" })
  })

  it("handles missing metadata", () => {
    const result = documentToLcDocument({ id: "doc-1", content: "hello" })
    expect(result.metadata).toEqual({})
  })
})
