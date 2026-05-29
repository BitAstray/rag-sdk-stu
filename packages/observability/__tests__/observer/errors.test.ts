import { describe, it, expect, vi } from 'vitest'
import { wrapObserverWithErrorHandling } from '../../src/observer/errors.js'
import type { RAGObserver } from '../../src/types/observer.js'
import type { RAGEvent } from '../../src/types/event.js'

describe('wrapObserverWithErrorHandling', () => {
  const createMockEvent = (): RAGEvent => ({
    name: 'test.event',
    traceId: 'trace-1',
    scope: 'runtime',
    stage: 'retrieval',
    timestamp: new Date().toISOString(),
  })

  it('应正常调用 observer 方法', () => {
    const observer: RAGObserver = {
      onEvent: vi.fn(),
    }
    const wrapped = wrapObserverWithErrorHandling(observer)

    const event = createMockEvent()
    wrapped.onEvent?.(event)

    expect(observer.onEvent).toHaveBeenCalledWith(event)
  })

  it('应捕获同步错误并调用 onError 回调', () => {
    const error = new Error('sync error')
    const observer: RAGObserver = {
      onEvent: vi.fn().mockImplementation(() => {
        throw error
      }),
    }
    const onError = vi.fn()
    const wrapped = wrapObserverWithErrorHandling(observer, onError)

    const event = createMockEvent()
    wrapped.onEvent?.(event)

    expect(onError).toHaveBeenCalledWith(error, {
      method: 'onEvent',
      observer,
    })
  })

  it('应捕获异步错误并调用 onError 回调', async () => {
    const error = new Error('async error')
    const observer: RAGObserver = {
      flush: vi.fn().mockRejectedValue(error),
    }
    const onError = vi.fn()
    const wrapped = wrapObserverWithErrorHandling(observer, onError)

    wrapped.flush?.()

    // 等待 microtask 完成
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onError).toHaveBeenCalledWith(error, {
      method: 'flush',
      observer,
    })
  })

  it('应跳过未定义的方法', () => {
    const observer: RAGObserver = {}
    const wrapped = wrapObserverWithErrorHandling(observer)

    expect(wrapped.onEvent).toBeUndefined()
    expect(wrapped.onError).toBeUndefined()
    expect(wrapped.onTraceEnd).toBeUndefined()
    expect(wrapped.flush).toBeUndefined()
    expect(wrapped.shutdown).toBeUndefined()
  })
})
