import { createDefaultRuntime } from "../src/index.js"
import {
  createConsoleObserver,
  createRAGObserver,
  createMemoryTraceExporter,
} from "@rag-sdk/observability"
import type { Retriever, Generator, Query, Chunk } from "@rag-sdk/core"

// Mock Retriever
const mockRetriever: Retriever = {
  retrieve: async (query: Query) => {
    return [
      {
        id: "chunk-1",
        content: "Company vacation policy: 15 days per year",
        score: 0.95,
        source: "handbook",
      },
      {
        id: "chunk-2",
        content: "Vacation request must be submitted 2 weeks in advance",
        score: 0.85,
        source: "handbook",
      },
    ] as Chunk[]
  },
}

// Mock Generator
const mockGenerator: Generator = {
  generate: async (params: { query: Query; chunks: Chunk[] }) => {
    return `Based on ${params.chunks.length} chunks, the company vacation policy is 15 days per year.`
  },
}

async function main() {
  console.log("=== Runtime Observer Demo ===\n")

  // 1. 不传 observer（原有行为）
  console.log("1. Without Observer (original behavior)")
  const runtime1 = createDefaultRuntime({
    retriever: mockRetriever,
    generator: mockGenerator,
  })

  const result1 = await runtime1.run({ query: "What is the vacation policy?" })
  console.log("Answer:", result1.outputs?.generator?.value)
  console.log("Duration:", result1.durationMs, "ms")
  console.log()

  // 2. 使用 ConsoleObserver
  console.log("2. With ConsoleObserver")
  const consoleObserver = createConsoleObserver({ level: "info" })

  const runtime2 = createDefaultRuntime({
    retriever: mockRetriever,
    generator: mockGenerator,
    observer: consoleObserver,
  })

  const result2 = await runtime2.run(
    { query: "What is the vacation policy?" },
    {
      requestId: "req-001",
      trace: {
        traceId: "trace-001",
        tags: { app: "test" },
      },
    }
  )
  console.log("Answer:", result2.outputs?.generator?.value)
  console.log("TraceId:", result2.traceId)
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

  const runtime3 = createDefaultRuntime({
    retriever: mockRetriever,
    generator: mockGenerator,
    observer: ragObserver,
  })

  const result3 = await runtime3.run(
    { query: "What is the vacation policy?" },
    {
      requestId: "req-002",
      trace: {
        traceId: "trace-002",
        tags: { app: "kb", tenant: "company" },
      },
    }
  )
  console.log("Answer:", result3.outputs?.generator?.value)
  console.log("TraceId:", result3.traceId)

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
