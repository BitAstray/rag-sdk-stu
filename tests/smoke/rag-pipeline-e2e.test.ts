import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { MarkdownLoader, SimpleChunker, MockEmbedder, MemoryVectorStore, PipelineSteps } from "@rag-sdk/indexing"
import { createDefaultRuntime } from "@rag-sdk/runtime"
import { InMemoryRetriever } from "../helpers/in-memory-retriever.js"

describe("RAG pipeline end-to-end smoke", () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "rag-smoke-"))
    await writeFile(join(tempDir, "typescript.md"), "# TypeScript\n\nTypeScript is a typed superset of JavaScript that compiles to plain JavaScript.")
    await writeFile(join(tempDir, "rag.md"), "# RAG\n\nRetrieval-Augmented Generation combines information retrieval with text generation.")
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it("full pipeline: load → chunk → embed → store → retrieve → generate", async () => {
    const store = new MemoryVectorStore()
    const embedder = new MockEmbedder()
    const chunker = new SimpleChunker()
    const loader = new MarkdownLoader(tempDir)

    // Index
    const indexResult = await PipelineSteps.fromLoader(loader)
      .pipe(PipelineSteps.chunk(chunker))
      .pipe(PipelineSteps.embed(embedder))
      .pipe(PipelineSteps.store(store))
      .consume()
    expect(indexResult.totalDocuments).toBe(2)
    expect(indexResult.totalChunks).toBeGreaterThan(0)
    expect(indexResult.errors).toHaveLength(0)

    // Build retriever from indexed data
    const retriever = new InMemoryRetriever(store)
    const docs = await loader.load()
    for (const doc of docs) {
      const chunks = await chunker.chunk(doc)
      retriever.addChunks(chunks)
    }

    // Runtime
    const runtime = createDefaultRuntime({
      retriever: { retrieve: (q) => retriever.retrieve(q) },
      generator: {
        async generate({ chunks }) {
          return chunks.map((c) => c.content).join("\n")
        },
      },
    })

    const result = await runtime.run({ query: "What is TypeScript?" })

    expect(result.outputs.generator.value.answer).toBeTruthy()
    expect(result.outputs.postprocessor.value.candidates.length).toBeGreaterThan(0)
    expect(result.outputs.preprocessor.value).toBeDefined()
    expect(result.outputs.retriever.value).toBeDefined()
    expect(result.outputs.retriever.value.candidates.length).toBeGreaterThan(0)
    expect(result.outputs.postprocessor.value).toBeDefined()
    expect(result.outputs.generator.value).toBeDefined()
    expect(result.outputs.generator.value.answer).toBeTruthy()
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
