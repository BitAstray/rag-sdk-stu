/**
 * 创建 ISO 8601 时间戳字符串
 */
export function createTimestamp(): string {
  return new Date().toISOString()
}
