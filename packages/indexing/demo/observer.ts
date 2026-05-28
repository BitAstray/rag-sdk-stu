import { PipelineSteps } from "../src/index.js"
import {
  createConsoleObserver,
  createRAGObserver,
  createMemoryTraceExporter,
} from "@rag-sdk/observability"
import type { Document, Chunk } from "@rag-sdk/core"

// Mock Loader
const mockDocuments: Document[] = [
  { content: "Company vacation policy: 15 days per year", metadata: { source: "handbook" } },
  { content: "Remote work policy: 3 days per week", metadata: { source: "handbook" } },
  { content: "Sick leave policy: 10 days per year", metadata: { source: "handbook" } },
]

async function main() {
  console.log("=== Indexing Observer Demo ===\n")

  // 1. 不传 observer（原有行为）
  console.log("1. Without Observer (original behavior)")
  const result1 = await PipelineSteps
    .fromLoader({
      load: async () => mockDocuments,
    })
    .pipe(PipelineSteps.chunk({
      chunk: async (doc) => [{
        id: `chunk-${doc.content.substring(0, 10)}`,
        content: doc.content,
        metadata: doc.metadata,
      }],
    }), "chunk")
    .pipe(PipelineSteps.embed({
      embed: async (chunks) => chunks.map(c => ({
        id: c.id,
        values: [0.1, 0.2, 0.3],
        metadata: c.metadata,
      })),
    }), "embed")
    .pipe(PipelineSteps.store({
      upsert: async (vectors) => {
        console.log(`  Stored ${vectors.length} vectors`)
      },
    }), "store")
    .consume()

  console.log("Result:", {
    totalDocuments: result1.totalDocuments,
    totalChunks: result1.totalChunks,
    errors: result1.errors.length,
  })
  console.log()

  // 2. 使用 ConsoleObserver
  console.log("2. With ConsoleObserver")
  const consoleObserver = createConsoleObserver({ level: "info" })

  const result2 = await PipelineSteps
    .fromLoader(
      { load: async () => mockDocuments },
      {
        observer: consoleObserver,
        trace: {
          traceId: "indexing-001",
          dataset: "company-handbook",
          version: "v1",
        },
      }
    )
    .pipe(PipelineSteps.chunk({
      chunk: async (doc) => [{
        id: `chunk-${doc.content.substring(0, 10)}`,
        content: doc.content,
        metadata: doc.metadata,
      }],
    }), "chunk")
    .pipe(PipelineSteps.embed({
      embed: async (chunks) => chunks.map(c => ({
        id: c.id,
        values: [0.1, 0.2, 0.3],
        metadata: c.metadata,
      })),
    }), "embed")
    .pipe(PipelineSteps.store({
      upsert: async (vectors) => {
        console.log(`  Stored ${vectors.length} vectors`)
      },
    }), "store")
    .consume()

  console.log("Result:", {
    totalDocuments: result2.totalDocuments,
    totalChunks: result2.totalChunks,
    errors: result2.errors.length,
  })
  console.log()

  // 3. 使用 RAGObserver with Memory Exporter
  console.log("3. With RAGObserver and Memory Exporter")
  const memoryExporter = createMemoryTraceExporter()

  const ragObserver = createRAGObserver({
    exporters: [memoryExporter],
    sampling: {
      rate: 1,
      alwaysSampleOnError: true,
    },
  })

  const result3 = await PipelineSteps
    .fromLoader(
      { load: async () => mockDocuments },
      {
        observer: ragObserver,
        trace: {
          traceId: "indexing-002",
          dataset: "company-handbook",
          version: "v2",
          tags: { environment: "production" },
        },
      }
    )
    .pipe(PipelineSteps.chunk({
      chunk: async (doc) => [{
        id: `chunk-${doc.content.substring(0, 10)}`,
        content: doc.content,
        metadata: doc.metadata,
      }],
    }), "chunk")
    .pipe(PipelineSteps.embed({
      embed: async (chunks) => chunks.map(c => ({
        id: c.id,
        values: [0.1, 0.2, 0.3],
        metadata: c.metadata,
      })),
    }), "embed")
    .pipe(PipelineSteps.store({
      upsert: async (vectors) => {
        console.log(`  Stored ${vectors.length} vectors`)
      },
    }), "store")
    .consume()

  console.log("Result:", {
    totalDocuments: result3.totalDocuments,
    totalChunks: result3.totalChunks,
    errors: result3.errors.length,
  })

  // 检查捕获的 traces
  const traces = memoryExporter.getTraces()
  console.log("\nCaptured traces:", traces.length)
  if (traces.length > 0) {
    const trace = traces[0]
    console.log("Trace details:", {
      traceId: trace.traceId,
      scope: trace.scope,
      status: trace.status,
      eventCount: trace.events.length,
      durationMs: trace.durationMs,
    })
    console.log("Events:")
    for (const event of trace.events) {
      console.log(`  - ${event.name} (${event.stage})`)
    }
  }

  console.log("\n=== Demo Complete ===")
}

main().catch(console.error)
