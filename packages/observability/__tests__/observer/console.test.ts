import { describe, it, expect, vi } from 'vitest'
import { createConsoleObserver } from '../../src/observer/console.js'
import type { RAGEvent } from '../../src/types/event.js'
import type { RAGTrace } from '../../src/types/trace.js'

describe('createConsoleObserver', () => {
  const createMockEvent = (): RAGEvent => ({
    name: 'test.event',
    traceId: 'trace-1',
    scope: 'runtime',
    stage: 'retrieval',
    timestamp: new Date().toISOString(),
  })

  const createMockTrace = (): RAGTrace => ({
    traceId: 'trace-1',
    scope: 'runtime',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: 100,
    status: 'ok',
    events: [],
  })

  it('应创建 observer', () => {
    const observer = createConsoleObserver()

    expect(observer).toBeDefined()
    expect(observer.onEvent).toBeTypeOf('function')
    expect(observer.onError).toBeTypeOf('function')
    expect(observer.onTraceEnd).toBeTypeOf('function')
  })

  it('应记录事件到 console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const observer = createConsoleObserver()

    observer.onEvent?.(createMockEvent())

    expect(consoleSpy).toHaveBeenCalledWith(
      '[observability] test.event',
      expect.objectContaining({ traceId: 'trace-1' })
    )

    consoleSpy.mockRestore()
  })

  it('应记录错误到 console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const observer = createConsoleObserver()

    observer.onError?.({
      name: 'test.error',
      traceId: 'trace-1',
      scope: 'runtime',
      stage: 'retrieval',
      timestamp: new Date().toISOString(),
      error: { message: 'test error' },
    } as any)

    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('应记录 trace 结束到 console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const observer = createConsoleObserver()

    observer.onTraceEnd?.(createMockTrace())

    expect(consoleSpy).toHaveBeenCalledWith(
      '[observability] trace completed',
      expect.objectContaining({ traceId: 'trace-1' })
    )

    consoleSpy.mockRestore()
  })

  it('应实现 flush 和 shutdown', () => {
    const observer = createConsoleObserver()

    expect(observer.flush?.()).toBeUndefined()
    expect(observer.shutdown?.()).toBeUndefined()
  })
})
