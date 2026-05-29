import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { MarkdownLoader, SimpleChunker, MockEmbedder, MemoryVectorStore, PipelineSteps } from "@rag-sdk/indexing"
import { createDefaultRuntime } from "@rag-sdk/runtime"
import { createRAGObserver, createMemoryTraceExporter } from "@rag-sdk/observability"
import { InMemoryRetriever } from "../helpers/in-memory-retriever.js"

describe("RAG pipeline with observer smoke", () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "rag-observer-smoke-"))
    await writeFile(join(tempDir, "ai.md"), "# AI\n\nArtificial Intelligence is the simulation of human intelligence by machines.")
    await writeFile(join(tempDir, "ml.md"), "# ML\n\nMachine Learning is a subset of AI that enables systems to learn from data.")
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it("应完成完整的 RAG 管线并收集 observer 事件", async () => {
    // 创建 observer 和 exporter
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
    })

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

    // Build retriever
    const retriever = new InMemoryRetriever(store)
    const docs = await loader.load()
    for (const doc of docs) {
      const chunks = await chunker.chunk(doc)
      retriever.addChunks(chunks)
    }

    // Runtime with observer
    const runtime = createDefaultRuntime({
      retriever: { retrieve: (q) => retriever.retrieve(q) },
      generator: {
        async generate({ chunks }) {
          return chunks.map((c) => c.content).join("\n")
        },
      },
      observer,
    })

    // 运行时
    const result = await runtime.run({
      query: "What is AI?",
    })

    // 验证结果
    expect(result.outputs.generator.value.answer).toBeTruthy()
    expect(result.outputs.retriever.value.candidates.length).toBeGreaterThan(0)

    // 验证 observer 收集的事件
    const traces = exporter.getTraces()
    expect(traces.length).toBeGreaterThanOrEqual(1)

    const trace = traces[0]
    expect(trace.events.length).toBeGreaterThan(0)
    expect(trace.status).toBe("ok")
    expect(trace.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("应支持错误场景的 observer 事件", async () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
    })

    const store = new MemoryVectorStore()
    const embedder = new MockEmbedder()
    const chunker = new SimpleChunker()
    const loader = new MarkdownLoader(tempDir)

    // Index
    await PipelineSteps.fromLoader(loader)
      .pipe(PipelineSteps.chunk(chunker))
      .pipe(PipelineSteps.embed(embedder))
      .pipe(PipelineSteps.store(store))
      .consume()

    // 创建会失败的 runtime
    const runtime = createDefaultRuntime({
      retriever: {
        async retrieve() {
          throw new Error("Retrieval failed")
        },
      },
      generator: {
        async generate() {
          return "should not reach here"
        },
      },
      observer,
    })

    let errorCaught = false
    try {
      await runtime.run({
        query: "test",
      })
    } catch {
      errorCaught = true
    }

    expect(errorCaught).toBe(true)

    // 验证 observer 收集了错误事件
    const traces = exporter.getTraces()
    expect(traces.length).toBeGreaterThanOrEqual(1)

    const trace = traces[0]
    expect(trace.status).toBe("error")
  })

  it("应支持多个 observer", async () => {
    const exporter1 = createMemoryTraceExporter()
    const exporter2 = createMemoryTraceExporter()
    const observer1 = createRAGObserver({ exporters: [exporter1] })
    const observer2 = createRAGObserver({ exporters: [exporter2] })

    const store = new MemoryVectorStore()
    const embedder = new MockEmbedder()
    const chunker = new SimpleChunker()
    const loader = new MarkdownLoader(tempDir)

    // Index
    await PipelineSteps.fromLoader(loader)
      .pipe(PipelineSteps.chunk(chunker))
      .pipe(PipelineSteps.embed(embedder))
      .pipe(PipelineSteps.store(store))
      .consume()

    // Build retriever
    const retriever = new InMemoryRetriever(store)
    const docs = await loader.load()
    for (const doc of docs) {
      const chunks = await chunker.chunk(doc)
      retriever.addChunks(chunks)
    }

    const runtime1 = createDefaultRuntime({
      retriever: { retrieve: (q) => retriever.retrieve(q) },
      generator: {
        async generate({ chunks }) {
          return chunks.map((c) => c.content).join("\n")
        },
      },
      observer: observer1,
    })

    const runtime2 = createDefaultRuntime({
      retriever: { retrieve: (q) => retriever.retrieve(q) },
      generator: {
        async generate({ chunks }) {
          return chunks.map((c) => c.content).join("\n")
        },
      },
      observer: observer2,
    })

    // 传入多个 observer
    await runtime1.run({
      query: "What is ML?",
    })

    await runtime2.run({
      query: "What is AI?",
    })

    // 两个 exporter 都应该有数据
    expect(exporter1.getTraces().length).toBeGreaterThanOrEqual(1)
    expect(exporter2.getTraces().length).toBeGreaterThanOrEqual(1)
  })
})
