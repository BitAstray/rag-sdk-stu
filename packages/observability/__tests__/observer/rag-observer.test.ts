import { describe, it, expect, vi } from 'vitest'
import { createRAGObserver } from '../../src/observer/rag-observer.js'
import type { RAGEvent } from '../../src/types/event.js'
import type { RAGTrace } from '../../src/types/trace.js'
import type { TraceExporter } from '../../src/types/exporter.js'

describe('createRAGObserver', () => {
  const createMockEvent = (name: string, traceId = 'trace-1'): RAGEvent => ({
    name,
    traceId,
    scope: 'runtime',
    stage: 'retrieval',
    timestamp: new Date().toISOString(),
  })

  it('应创建 observer', () => {
    const observer = createRAGObserver()

    expect(observer).toBeDefined()
    expect(observer.startTrace).toBeTypeOf('function')
    expect(observer.onEvent).toBeTypeOf('function')
    expect(observer.onError).toBeTypeOf('function')
    expect(observer.onTraceEnd).toBeTypeOf('function')
    expect(observer.flush).toBeTypeOf('function')
    expect(observer.shutdown).toBeTypeOf('function')
  })

  it('应收集事件直到 trace 结束', () => {
    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    const handle = observer.startTrace!('trace-1', 'runtime')

    observer.onEvent?.(createMockEvent('runtime.retrieval.start'))
    observer.onEvent?.(createMockEvent('runtime.retrieval.complete'))

    expect(exporter.export).not.toHaveBeenCalled()

    handle.end('ok')

    expect(exporter.export).toHaveBeenCalled()
    const exportedTrace = vi.mocked(exporter.export).mock.calls[0][0]
    expect(exportedTrace.status).toBe('ok')
  })

  it('应在 run.fail 时标记 trace 为错误', () => {
    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    const handle = observer.startTrace!('trace-1', 'runtime')
    observer.onEvent?.(createMockEvent('runtime.run.fail'))

    handle.end('error')

    expect(exporter.export).toHaveBeenCalled()
    const exportedTrace = vi.mocked(exporter.export).mock.calls[0][0]
    expect(exportedTrace.status).toBe('error')
  })

  it('应应用采样', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)

    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({
      exporters: [exporter],
      sampling: { rate: 0.01 },
    })

    const handle = observer.startTrace!('trace-1', 'runtime')
    observer.onEvent?.(createMockEvent('runtime.run.complete'))
    handle.end('ok')

    expect(exporter.export).not.toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('应应用脱敏', () => {
    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({
      exporters: [exporter],
      redact: { fields: ['password'] },
    })

    const handle = observer.startTrace!('trace-1', 'runtime')
    observer.onEvent?.(createMockEvent('runtime.retrieval.start'))
    observer.onEvent?.({
      ...createMockEvent('runtime.run.complete'),
      attributes: { password: 'secret' },
    })
    
    handle.end('ok')

    const exportedTrace = vi.mocked(exporter.export).mock.calls[0][0]
    expect(exportedTrace.events[1].attributes?.password).toBe('[REDACTED]')
  })

  it('应支持多个 exporter', () => {
    const exporter1: TraceExporter = { export: vi.fn() }
    const exporter2: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter1, exporter2] })

    const handle = observer.startTrace!('trace-1', 'runtime')
    observer.onEvent?.(createMockEvent('runtime.run.complete'))
    handle.end('ok')

    expect(exporter1.export).toHaveBeenCalled()
    expect(exporter2.export).toHaveBeenCalled()
  })

  it('应处理 onTraceEnd', () => {
    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    const trace: RAGTrace = {
      traceId: 'trace-1',
      scope: 'runtime',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationMs: 100,
      status: 'ok',
      events: [],
    }

    observer.onTraceEnd?.(trace)

    expect(exporter.export).toHaveBeenCalled()
  })

  it('应导出未完成的 trace 在 shutdown 时', async () => {
    const exporter: TraceExporter = { export: vi.fn(), shutdown: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    observer.startTrace!('trace-1', 'runtime')
    observer.onEvent?.(createMockEvent('runtime.retrieval.start'))

    await observer.shutdown?.()

    expect(exporter.export).toHaveBeenCalled()
    expect(exporter.shutdown).toHaveBeenCalled()
  })

  it('应调用 flush', async () => {
    const exporter: TraceExporter = { export: vi.fn(), flush: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    await observer.flush?.()

    expect(exporter.flush).toHaveBeenCalled()
  })

  it('应处理 indexing scope', () => {
    const exporter: TraceExporter = { export: vi.fn() }
    const observer = createRAGObserver({ exporters: [exporter] })

    const handle = observer.startTrace!('trace-1', 'indexing')
    observer.onEvent?.({
      ...createMockEvent('indexing.run.complete'),
      scope: 'indexing',
    })
    
    handle.end('ok')

    const exportedTrace = vi.mocked(exporter.export).mock.calls[0][0]
    expect(exportedTrace.scope).toBe('indexing')
  })
})
