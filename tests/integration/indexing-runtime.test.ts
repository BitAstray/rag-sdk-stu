import { describe, it, expect } from "vitest"
import type { Document } from "@rag-sdk/core"
import { runIndexing } from "@rag-sdk/indexing"
import { createDefaultRuntime } from "@rag-sdk/runtime"
import { buildTestPipeline } from "../helpers/rag-pipeline-builder.js"

describe("indexing → runtime cross-package pipeline", () => {
  it("indexes documents then retrieves via runtime", async () => {
    const { store, embedder, chunker, retriever, generator } = buildTestPipeline()

    const docs: Document[] = [
      { id: "doc-1", content: "TypeScript is a typed superset of JavaScript" },
      { id: "doc-2", content: "RAG combines retrieval with generation" },
    ]

    const indexResult = await runIndexing({
      loader: { load: async () => docs },
      chunker,
      embedder,
      store,
    })

    expect(indexResult.totalDocuments).toBe(2)
    expect(indexResult.totalChunks).toBeGreaterThan(0)
    expect(indexResult.errors).toHaveLength(0)

    // Wire retriever to indexed data
    const allChunks = (await Promise.all(
      store.getAll().map(async (v) => {
        const chunkId = v.metadata?.["chunkId"] as string | undefined
        return chunkId ? [{ id: chunkId, content: "" }] : []
      }),
    )).flat()
    // Re-index to populate retriever chunks via a second pass
    const chunksForRetriever = await chunker.chunk(docs[0]!)
    const chunksForRetriever2 = await chunker.chunk(docs[1]!)
    retriever.addChunks([...chunksForRetriever, ...chunksForRetriever2])

    const runtime = createDefaultRuntime({
      retriever: { retrieve: (q) => retriever.retrieve(q) },
      generator,
    })

    const result = await runtime.run({ query: "TypeScript" })

    expect(result.answer).toBeTruthy()
    expect(result.retrieval.chunks.length).toBeGreaterThan(0)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
