import {
  createConsoleObserver,
  createRAGObserver,
  createConsoleExporter,
  createMemoryTraceExporter,
  createNoopObserver,
  validateEventName,
  createTimestamp,
  createTraceId,
} from "../src/index.js"

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
    fields: ["user.email"],
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
  attributes: { query: "What is the company vacation policy?" },
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
}

console.log("\n=== Demo Complete ===")
