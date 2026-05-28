/**
 * 创建 ISO 时间戳
 */
export function createTimestamp(): string {
  return new Date().toISOString()
}
