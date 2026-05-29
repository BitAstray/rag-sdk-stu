import { describe, it, expect, vi } from 'vitest'
import { createConsoleExporter } from '../../src/exporters/console.js'
import type { RAGTrace } from '../../src/types/trace.js'

describe('createConsoleExporter', () => {
  const createMockTrace = (): RAGTrace => ({
    traceId: 'trace-1',
    scope: 'runtime',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: 100,
    status: 'ok',
    events: [],
  })

  it('应创建导出器', () => {
    const exporter = createConsoleExporter()

    expect(exporter).toBeDefined()
    expect(exporter.export).toBeTypeOf('function')
  })

  it('应导出 trace 到 console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const exporter = createConsoleExporter()
    const trace = createMockTrace()

    exporter.export(trace)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[exporter] trace exported',
      expect.objectContaining({
        traceId: 'trace-1',
        scope: 'runtime',
        status: 'ok',
      })
    )

    consoleSpy.mockRestore()
  })
})
