import { describe, it, expect } from 'vitest'
import { createRedactionMiddleware } from '../../src/redaction/redactor.js'
import type { RAGEvent } from '../../src/types/event.js'
import type { RAGTrace } from '../../src/types/trace.js'

describe('createRedactionMiddleware', () => {
  const createMockEvent = (attributes?: Record<string, unknown>): RAGEvent => ({
    name: 'test.event',
    traceId: 'trace-1',
    scope: 'runtime',
    stage: 'retrieval',
    timestamp: new Date().toISOString(),
    attributes,
  })

  const createMockTrace = (events: RAGEvent[] = []): RAGTrace => ({
    traceId: 'trace-1',
    scope: 'runtime',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: 100,
    status: 'ok',
    events,
  })

  it('应创建 redaction 中间件', () => {
    const redactor = createRedactionMiddleware()

    expect(redactor).toBeDefined()
    expect(redactor.redactEvent).toBeTypeOf('function')
    expect(redactor.redactError).toBeTypeOf('function')
    expect(redactor.redactTrace).toBeTypeOf('function')
  })

  it('应脱敏指定字段', () => {
    const redactor = createRedactionMiddleware({
      fields: ['password', 'secret'],
    })

    const event = createMockEvent({
      username: 'user1',
      password: 'secret123',
      secret: 'api-key',
    })

    const redacted = redactor.redactEvent(event)

    expect(redacted.attributes?.username).toBe('user1')
    expect(redacted.attributes?.password).toBe('[REDACTED]')
    expect(redacted.attributes?.secret).toBe('[REDACTED]')
  })

  it('应截断长内容字段', () => {
    const redactor = createRedactionMiddleware({
      contentPreviewLength: 10,
    })

    const event = createMockEvent({
      query: 'a'.repeat(20),
      content: 'short',
    })

    const redacted = redactor.redactEvent(event)

    expect(redacted.attributes?.query).toBe('a'.repeat(10) + '...')
    expect(redacted.attributes?.content).toBe('short')
  })

  it('应支持自定义替换文本', () => {
    const redactor = createRedactionMiddleware({
      fields: ['token'],
      replacement: '***',
    })

    const event = createMockEvent({ token: 'abc123' })
    const redacted = redactor.redactEvent(event)

    expect(redacted.attributes?.token).toBe('***')
  })

  it('应脱敏 trace 中的所有事件', () => {
    const redactor = createRedactionMiddleware({
      fields: ['password'],
    })

    const trace = createMockTrace([
      createMockEvent({ password: 'secret1' }),
      createMockEvent({ password: 'secret2' }),
    ])

    const redacted = redactor.redactTrace(trace)

    expect(redacted.events[0].attributes?.password).toBe('[REDACTED]')
    expect(redacted.events[1].attributes?.password).toBe('[REDACTED]')
  })
})
