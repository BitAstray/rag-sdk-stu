import { describe, it, expect } from 'vitest'
import { createNoopObserver } from '../../src/observer/noop.js'

describe('createNoopObserver', () => {
  it('应返回空对象', () => {
    const observer = createNoopObserver()

    expect(observer).toBeDefined()
    expect(observer.onEvent).toBeUndefined()
    expect(observer.onError).toBeUndefined()
    expect(observer.onTraceEnd).toBeUndefined()
    expect(observer.flush).toBeUndefined()
    expect(observer.shutdown).toBeUndefined()
  })
})
