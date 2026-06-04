/**
 * 创建唯一 ID，支持自定义前缀
 * 默认前缀为 "id"，格式：`<prefix>-<timestamp>-<random>`
 */
export function createId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/** 便捷别名 — 创建 trace 前缀的 ID */
export const createTraceId = (): string => createId("trace")
