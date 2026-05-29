import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSamplingMiddleware } from '../../src/sampling/sampler.js'

describe('createSamplingMiddleware', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应使用默认配置（rate=1）', () => {
    const sampler = createSamplingMiddleware()

    expect(sampler.shouldSample(false)).toBe(true)
  })

  it('应按 rate 采样', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const sampler = createSamplingMiddleware({ rate: 0.3 })

    expect(sampler.shouldSample(false)).toBe(false)
  })

  it('应采样当 random < rate', () => {
    vi.mocked(Math.random).mockReturnValue(0.2)
    const sampler = createSamplingMiddleware({ rate: 0.5 })

    expect(sampler.shouldSample(false)).toBe(true)
  })

  it('应始终采样错误（默认 alwaysSampleOnError）', () => {
    vi.mocked(Math.random).mockReturnValue(0.99)
    const sampler = createSamplingMiddleware({ rate: 0.01 })

    expect(sampler.shouldSample(true)).toBe(true)
  })

  it('应不采样错误当 alwaysSampleOnError=false', () => {
    vi.mocked(Math.random).mockReturnValue(0.99)
    const sampler = createSamplingMiddleware({ rate: 0.01, alwaysSampleOnError: false })

    expect(sampler.shouldSample(true)).toBe(false)
  })

  it('应拒绝无效 rate', () => {
    expect(() => createSamplingMiddleware({ rate: -0.1 })).toThrow()
    expect(() => createSamplingMiddleware({ rate: 1.1 })).toThrow()
  })
})
