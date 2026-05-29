import { describe, it, expect, vi } from "vitest"
import {
  createRAGObserver,
  createCompositeObserver,
  createConsoleObserver,
  createNoopObserver,
  createRedactionMiddleware,
  createSamplingMiddleware,
  createMemoryTraceExporter,
  createConsoleExporter,
} from "@rag-sdk/observability"
import type { RAGEvent, RAGTrace, TraceExporter } from "@rag-sdk/observability"

describe("observability integration", () => {
  const createMockEvent = (name: string, traceId = "trace-1"): RAGEvent => ({
    name,
    traceId,
    scope: "runtime",
    stage: "retrieval",
    timestamp: new Date().toISOString(),
  })

  it("RAG Observer 应收集事件并导出 trace", () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
    })

    // 模拟 runtime 事件流
    observer.onEvent?.(createMockEvent("runtime.query.receive"))
    observer.onEvent?.(createMockEvent("runtime.retrieval.start"))
    observer.onEvent?.(createMockEvent("runtime.retrieval.complete"))
    observer.onEvent?.(createMockEvent("runtime.run.complete"))

    const traces = exporter.getTraces()
    expect(traces).toHaveLength(1)
    expect(traces[0].events).toHaveLength(4)
    expect(traces[0].status).toBe("ok")
  })

  it("RAG Observer 应处理错误事件", () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
    })

    observer.onEvent?.(createMockEvent("runtime.retrieval.start"))
    observer.onError?.({
      name: "retrieval.error",
      traceId: "trace-1",
      scope: "runtime",
      stage: "retrieval",
      timestamp: new Date().toISOString(),
      error: { message: "Retrieval failed" },
    })
    observer.onEvent?.(createMockEvent("runtime.run.fail"))

    const traces = exporter.getTraces()
    expect(traces).toHaveLength(1)
    expect(traces[0].status).toBe("error")
    expect(traces[0].errors).toHaveLength(1)
  })

  it("Composite Observer 应组合多个 observer", () => {
    const exporter1 = createMemoryTraceExporter()
    const exporter2 = createMemoryTraceExporter()
    const observer1 = createRAGObserver({ exporters: [exporter1] })
    const observer2 = createRAGObserver({ exporters: [exporter2] })

    const composite = createCompositeObserver([observer1, observer2])

    composite.onEvent?.(createMockEvent("runtime.run.complete"))

    expect(exporter1.getTraces()).toHaveLength(1)
    expect(exporter2.getTraces()).toHaveLength(1)
  })

  it("Redaction 中间件应脱敏敏感字段", () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
      redact: {
        fields: ["password", "token"],
        contentPreviewLength: 50,
      },
    })

    observer.onEvent?.({
      ...createMockEvent("runtime.retrieval.start"),
      attributes: {
        query: "a".repeat(100),
        password: "secret123",
        token: "api-key-xyz",
      },
    })
    observer.onEvent?.(createMockEvent("runtime.run.complete"))

    const traces = exporter.getTraces()
    const event = traces[0].events[0]

    expect(event.attributes?.password).toBe("[REDACTED]")
    expect(event.attributes?.token).toBe("[REDACTED]")
    expect((event.attributes?.query as string).length).toBeLessThanOrEqual(53) // 50 + "..."
  })

  it("Sampling 中间件应按比例采样", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99)

    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
      sampling: { rate: 0.01 },
    })

    // 非错误 trace 应被采样掉
    observer.onEvent?.(createMockEvent("runtime.run.complete"))

    expect(exporter.getTraces()).toHaveLength(0)

    vi.restoreAllMocks()
  })

  it("Sampling 中间件应始终采样错误", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99)

    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter],
      sampling: { rate: 0.01, alwaysSampleOnError: true },
    })

    observer.onEvent?.(createMockEvent("runtime.run.fail"))

    expect(exporter.getTraces()).toHaveLength(1)

    vi.restoreAllMocks()
  })

  it("多个 exporter 应并行导出", () => {
    const exporter1 = createMemoryTraceExporter()
    const exporter2 = createMemoryTraceExporter()
    const observer = createRAGObserver({
      exporters: [exporter1, exporter2],
    })

    observer.onEvent?.(createMockEvent("runtime.run.complete"))

    expect(exporter1.getTraces()).toHaveLength(1)
    expect(exporter2.getTraces()).toHaveLength(1)
  })

  it("Observer 应隔离 exporter 错误", () => {
    const errorCallback = vi.fn()
    const failingExporter: TraceExporter = {
      export: () => {
        throw new Error("export failed")
      },
    }
    const successExporter = createMemoryTraceExporter()

    const observer = createRAGObserver({
      exporters: [failingExporter, successExporter],
      onError: errorCallback,
    })

    observer.onEvent?.(createMockEvent("runtime.run.complete"))

    // 错误被捕获，successExporter 仍然执行
    expect(errorCallback).toHaveBeenCalled()
    expect(successExporter.getTraces()).toHaveLength(1)
  })

  it("应支持 indexing scope", () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({ exporters: [exporter] })

    observer.onEvent?.({
      ...createMockEvent("indexing.load.start"),
      scope: "indexing",
      stage: "load",
    })
    observer.onEvent?.({
      ...createMockEvent("indexing.run.complete"),
      scope: "indexing",
      stage: "run",
    })

    const traces = exporter.getTraces()
    expect(traces).toHaveLength(1)
    expect(traces[0].scope).toBe("indexing")
  })

  it("shutdown 应导出未完成的 trace", async () => {
    const exporter = createMemoryTraceExporter()
    const observer = createRAGObserver({ exporters: [exporter] })

    observer.onEvent?.(createMockEvent("runtime.retrieval.start"))

    await observer.shutdown?.()

    expect(exporter.getTraces()).toHaveLength(1)
  })
})
