import {
  createConsoleObserver,
  createRAGObserver,
  createConsoleExporter,
  createMemoryTraceExporter,
  createNoopObserver,
  createCompositeObserver,
  createRedactionMiddleware,
  createSamplingMiddleware,
  validateEventName,
} from "../src/index.js"
import { createTimestamp, createTraceId } from "@rag-sdk/utils"

console.log("=== Observability Package Demo ===\n")

// 1. 验证事件名校验
console.log("1. Event Name Validation")
console.log(validateEventName("runtime.query.receive"))
console.log(validateEventName("indexing.load.complete"))
console.log(validateEventName("invalid.event"))
console.log(validateEventName("runtime.INVALID.action"))
console.log()

// 2. 验证工具函数
console.log("2. Utility Functions")
console.log("Timestamp:", createTimestamp())
console.log("TraceId:", createTraceId())
console.log()

// 3. 创建 NoopObserver
console.log("3. NoopObserver")
const noopObserver = createNoopObserver()
console.log("NoopObserver created:", noopObserver)
console.log()

// 4. 创建 ConsoleObserver
console.log("4. ConsoleObserver")
const consoleObserver = createConsoleObserver({ level: "info" })
console.log("ConsoleObserver created")

// 模拟事件
consoleObserver.onEvent?.({
  traceId: "trace-001",
  scope: "runtime",
  stage: "query",
  name: "runtime.query.receive",
  timestamp: createTimestamp(),
  attributes: { query: "test query" },
})
console.log()

// 5. 创建 RAGObserver with Exporters
console.log("5. RAGObserver with Exporters")
const memoryExporter = createMemoryTraceExporter()
const ragObserver = createRAGObserver({
  exporters: [
    createConsoleExporter({ level: "info" }),
    memoryExporter,
  ],
  sampling: {
    rate: 1,
    alwaysSampleOnError: true,
  },
  redact: {
    fields: ["user.email", "password"],
    maskContent: true,
    contentPreviewLength: 50,
  },
})
console.log("RAGObserver created")

// 模拟 runtime 事件流
console.log("\n6. Simulating Runtime Event Flow")
const traceId = "trace-002"

ragObserver.onEvent?.({
  traceId,
  scope: "runtime",
  stage: "query",
  name: "runtime.query.receive",
  timestamp: createTimestamp(),
  attributes: {
    query: "What is the company vacation policy?",
    "user.email": "user@example.com",
    password: "secret123",
  },
})

ragObserver.onEvent?.({
  traceId,
  scope: "runtime",
  stage: "retrieval",
  name: "runtime.retrieval.start",
  timestamp: createTimestamp(),
})

ragObserver.onEvent?.({
  traceId,
  scope: "runtime",
  stage: "retrieval",
  name: "runtime.retrieval.complete",
  timestamp: createTimestamp(),
  durationMs: 150,
  attributes: {
    candidateCount: 5,
    emptyRetrieval: false,
  },
})

ragObserver.onEvent?.({
  traceId,
  scope: "runtime",
  stage: "run",
  name: "runtime.run.complete",
  timestamp: createTimestamp(),
  durationMs: 500,
})

console.log("\n7. Memory Exporter Traces")
const traces = memoryExporter.getTraces()
console.log("Traces captured:", traces.length)
if (traces.length > 0) {
  console.log("First trace:", {
    traceId: traces[0].traceId,
    scope: traces[0].scope,
    status: traces[0].status,
    eventCount: traces[0].events.length,
  })

  // 验证脱敏效果
  const firstEvent = traces[0].events[0]
  console.log("\n8. Redaction Effect")
  console.log("Original query:", "What is the company vacation policy?")
  console.log("Redacted email:", firstEvent.attributes?.["user.email"])
  console.log("Redacted password:", firstEvent.attributes?.password)
}

// 9. Composite Observer
console.log("\n9. Composite Observer")
const exporter1 = createMemoryTraceExporter()
const exporter2 = createMemoryTraceExporter()
const observer1 = createRAGObserver({ exporters: [exporter1] })
const observer2 = createRAGObserver({ exporters: [exporter2] })
const composite = createCompositeObserver([observer1, observer2])

composite.onEvent?.({
  traceId: "trace-003",
  scope: "runtime",
  stage: "run",
  name: "runtime.run.complete",
  timestamp: createTimestamp(),
})

console.log("Exporter1 traces:", exporter1.getTraces().length)
console.log("Exporter2 traces:", exporter2.getTraces().length)

// 10. Sampling Middleware
console.log("\n10. Sampling Middleware")
const sampler = createSamplingMiddleware({ rate: 0.5, alwaysSampleOnError: true })
console.log("Sample (normal):", sampler.shouldSample(false))
console.log("Sample (error):", sampler.shouldSample(true))

// 11. Error Handling
console.log("\n11. Error Handling")
const errorObserver = createRAGObserver({
  exporters: [{
    export: () => { throw new Error("Export failed") }
  }],
  onError: (err, ctx) => {
    console.log("Error caught:", err.message)
    console.log("Method:", ctx.method)
  },
})

errorObserver.onEvent?.({
  traceId: "trace-004",
  scope: "runtime",
  stage: "run",
  name: "runtime.run.complete",
  timestamp: createTimestamp(),
})

console.log("\n=== Demo Complete ===")
