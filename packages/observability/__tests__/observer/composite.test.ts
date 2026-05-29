import { describe, it, expect, vi } from 'vitest'
import { createCompositeObserver } from '../../src/observer/composite.js'
import type { RAGObserver } from '../../src/types/observer.js'
import type { RAGEvent } from '../../src/types/event.js'
import type { RAGTrace } from '../../src/types/trace.js'

describe('createCompositeObserver', () => {
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

  it('应组合多个 observer 的 onEvent', () => {
    const observer1: RAGObserver = { onEvent: vi.fn() }
    const observer2: RAGObserver = { onEvent: vi.fn() }
    const composite = createCompositeObserver([observer1, observer2])

    const event = createMockEvent()
    composite.onEvent?.(event)

    expect(observer1.onEvent).toHaveBeenCalledWith(event)
    expect(observer2.onEvent).toHaveBeenCalledWith(event)
  })

  it('应组合多个 observer 的 onError', () => {
    const observer1: RAGObserver = { onError: vi.fn() }
    const observer2: RAGObserver = { onError: vi.fn() }
    const composite = createCompositeObserver([observer1, observer2])

    const error = { message: 'test error' }
    composite.onError?.(error as any)

    expect(observer1.onError).toHaveBeenCalledWith(error)
    expect(observer2.onError).toHaveBeenCalledWith(error)
  })

  it('应组合多个 observer 的 onTraceEnd', () => {
    const observer1: RAGObserver = { onTraceEnd: vi.fn() }
    const observer2: RAGObserver = { onTraceEnd: vi.fn() }
    const composite = createCompositeObserver([observer1, observer2])

    const trace = createMockTrace()
    composite.onTraceEnd?.(trace)

    expect(observer1.onTraceEnd).toHaveBeenCalledWith(trace)
    expect(observer2.onTraceEnd).toHaveBeenCalledWith(trace)
  })

  it('应并行调用 flush', async () => {
    const observer1: RAGObserver = { flush: vi.fn().mockResolvedValue(undefined) }
    const observer2: RAGObserver = { flush: vi.fn().mockResolvedValue(undefined) }
    const composite = createCompositeObserver([observer1, observer2])

    await composite.flush?.()

    expect(observer1.flush).toHaveBeenCalled()
    expect(observer2.flush).toHaveBeenCalled()
  })

  it('应并行调用 shutdown', async () => {
    const observer1: RAGObserver = { shutdown: vi.fn().mockResolvedValue(undefined) }
    const observer2: RAGObserver = { shutdown: vi.fn().mockResolvedValue(undefined) }
    const composite = createCompositeObserver([observer1, observer2])

    await composite.shutdown?.()

    expect(observer1.shutdown).toHaveBeenCalled()
    expect(observer2.shutdown).toHaveBeenCalled()
  })
})
