/**
 * 创建 traceId
 */
export function createTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
