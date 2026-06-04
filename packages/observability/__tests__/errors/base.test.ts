import { describe, it, expect } from 'vitest'
import { ObservabilityError } from '../../src/errors/base.js'

describe('ObservabilityError', () => {
  it('应创建基本错误', () => {
    const error = new ObservabilityError('test error')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ObservabilityError)
    expect(error.name).toBe('ObservabilityError')
    expect(error.message).toBe('test error')
    expect(error.code).toBeUndefined()
    expect(error.cause).toBeUndefined()
  })

  it('应支持错误码', () => {
    const error = new ObservabilityError('test error', 'ERR_TEST')

    expect(error.code).toBe('ERR_TEST')
  })

  it('应支持错误原因链', () => {
    const cause = new Error('original error')
    const error = new ObservabilityError('wrapped error', 'ERR_WRAP', cause)

    expect(error.cause).toBe(cause)
  })
})
