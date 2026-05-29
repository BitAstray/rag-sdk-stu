import { describe, it, expect, vi } from 'vitest'
import { emitEvent, emitError, createEmitContext } from '../../src/observer/emit.js'
import type { RAGObserver } from '@rag-sdk/observability'

describe('createEmitContext', () => {
  it('应创建上下文', () => {
    const ctx = createEmitContext('trace-1')

    expect(ctx.traceId).toBe('trace-1')
    expect(ctx.observer).toBeUndefined()
  })

  it('应包含 observer', () => {
    const observer: RAGObserver = { onEvent: vi.fn() }
    const ctx = createEmitContext('trace-1', observer)

    expect(ctx.observer).toBe(observer)
  })
})

describe('emitEvent', () => {
  it('应发射事件到 observer', () => {
    const observer: RAGObserver = { onEvent: vi.fn() }
    const ctx = createEmitContext('trace-1', observer)

    emitEvent(ctx, 'retrieval', 'runtime.retrieval.start', { key: 'value' }, 100)

    expect(observer.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        scope: 'runtime',
        stage: 'retrieval',
        name: 'runtime.retrieval.start',
        durationMs: 100,
        attributes: { key: 'value' },
      })
    )
  })

  it('应安全处理无 observer', () => {
    const ctx = createEmitContext('trace-1')

    expect(() => emitEvent(ctx, 'retrieval', 'runtime.retrieval.start')).not.toThrow()
  })

  it('应安全处理无 onEvent', () => {
    const observer: RAGObserver = {}
    const ctx = createEmitContext('trace-1', observer)

    expect(() => emitEvent(ctx, 'retrieval', 'runtime.retrieval.start')).not.toThrow()
  })
})

describe('emitError', () => {
  it('应发射错误到 observer', () => {
    const observer: RAGObserver = { onError: vi.fn() }
    const ctx = createEmitContext('trace-1', observer)
    const error = new Error('test error')

    emitError(ctx, 'retrieval', 'runtime.retrieval.fail', error, { key: 'value' })

    expect(observer.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        scope: 'runtime',
        stage: 'retrieval',
        name: 'runtime.retrieval.fail',
        attributes: { key: 'value' },
      })
    )
  })

  it('应安全处理无 observer', () => {
    const ctx = createEmitContext('trace-1')
    const error = new Error('test error')

    expect(() => emitError(ctx, 'retrieval', 'runtime.retrieval.fail', error)).not.toThrow()
  })

  it('应安全处理无 onError', () => {
    const observer: RAGObserver = {}
    const ctx = createEmitContext('trace-1', observer)
    const error = new Error('test error')

    expect(() => emitError(ctx, 'retrieval', 'runtime.retrieval.fail', error)).not.toThrow()
  })
})
