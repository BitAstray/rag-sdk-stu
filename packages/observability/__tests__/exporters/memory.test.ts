import { describe, it, expect } from 'vitest'
import { createMemoryTraceExporter } from '../../src/exporters/memory.js'
import type { RAGTrace } from '../../src/types/trace.js'

describe('createMemoryTraceExporter', () => {
  const createMockTrace = (traceId: string): RAGTrace => ({
    traceId,
    scope: 'runtime',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: 100,
    status: 'ok',
    events: [],
  })

  it('应创建导出器', () => {
    const exporter = createMemoryTraceExporter()

    expect(exporter).toBeDefined()
    expect(exporter.export).toBeTypeOf('function')
    expect(exporter.getTraces).toBeTypeOf('function')
    expect(exporter.clear).toBeTypeOf('function')
  })

  it('应存储 trace', () => {
    const exporter = createMemoryTraceExporter()
    const trace = createMockTrace('trace-1')

    exporter.export(trace)

    expect(exporter.getTraces()).toHaveLength(1)
    expect(exporter.getTraces()[0]).toEqual(trace)
  })

  it('应返回 trace 副本', () => {
    const exporter = createMemoryTraceExporter()
    const trace = createMockTrace('trace-1')

    exporter.export(trace)

    const traces = exporter.getTraces()
    traces.pop()

    expect(exporter.getTraces()).toHaveLength(1)
  })

  it('应清空 traces', () => {
    const exporter = createMemoryTraceExporter()

    exporter.export(createMockTrace('trace-1'))
    exporter.export(createMockTrace('trace-2'))

    expect(exporter.getTraces()).toHaveLength(2)

    exporter.clear()

    expect(exporter.getTraces()).toHaveLength(0)
  })
})
