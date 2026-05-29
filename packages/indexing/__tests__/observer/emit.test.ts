import { describe, it, expect, vi } from 'vitest'
import { emitEvent, emitError, createEmitContext } from '../../src/observer/emit.js'
import type { RAGObserver } from '@rag-sdk/observability'

describe('createEmitContext', () => {
  it('应创建基本上下文', () => {
    const ctx = createEmitContext('trace-1')

    expect(ctx.traceId).toBe('trace-1')
    expect(ctx.observer).toBeUndefined()
    expect(ctx.dataset).toBeUndefined()
    expect(ctx.version).toBeUndefined()
    expect(ctx.tags).toBeUndefined()
  })

  it('应包含 observer', () => {
    const observer: RAGObserver = { onEvent: vi.fn() }
    const ctx = createEmitContext('trace-1', observer)

    expect(ctx.observer).toBe(observer)
  })

  it('应包含选项', () => {
    const ctx = createEmitContext('trace-1', undefined, {
      dataset: 'test-dataset',
      version: 'v1',
      tags: { env: 'test' },
    })

    expect(ctx.dataset).toBe('test-dataset')
    expect(ctx.version).toBe('v1')
    expect(ctx.tags).toEqual({ env: 'test' })
  })
})

describe('emitEvent', () => {
  it('应发射事件到 observer', () => {
    const observer: RAGObserver = { onEvent: vi.fn() }
    const ctx = createEmitContext('trace-1', observer, {
      dataset: 'test-dataset',
      version: 'v1',
    })

    emitEvent(ctx, 'load', 'indexing.load.start', { filePath: '/test.md' }, 100)

    expect(observer.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        scope: 'indexing',
        stage: 'load',
        name: 'indexing.load.start',
        durationMs: 100,
        attributes: expect.objectContaining({
          dataset: 'test-dataset',
          version: 'v1',
          filePath: '/test.md',
        }),
      })
    )
  })

  it('应安全处理无 observer', () => {
    const ctx = createEmitContext('trace-1')

    expect(() => emitEvent(ctx, 'load', 'indexing.load.start')).not.toThrow()
  })

  it('应安全处理无 onEvent', () => {
    const observer: RAGObserver = {}
    const ctx = createEmitContext('trace-1', observer)

    expect(() => emitEvent(ctx, 'load', 'indexing.load.start')).not.toThrow()
  })
})

describe('emitError', () => {
  it('应发射错误到 observer', () => {
    const observer: RAGObserver = { onError: vi.fn() }
    const ctx = createEmitContext('trace-1', observer, {
      dataset: 'test-dataset',
    })
    const error = new Error('test error')

    emitError(ctx, 'load', 'indexing.load.fail', error, { filePath: '/test.md' })

    expect(observer.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'trace-1',
        scope: 'indexing',
        stage: 'load',
        name: 'indexing.load.fail',
        attributes: expect.objectContaining({
          dataset: 'test-dataset',
          filePath: '/test.md',
        }),
      })
    )
  })

  it('应安全处理无 observer', () => {
    const ctx = createEmitContext('trace-1')
    const error = new Error('test error')

    expect(() => emitError(ctx, 'load', 'indexing.load.fail', error)).not.toThrow()
  })

  it('应安全处理无 onError', () => {
    const observer: RAGObserver = {}
    const ctx = createEmitContext('trace-1', observer)
    const error = new Error('test error')

    expect(() => emitError(ctx, 'load', 'indexing.load.fail', error)).not.toThrow()
  })
})
