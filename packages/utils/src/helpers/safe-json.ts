/**
 * 安全 JSON 序列化
 */
export function safeStringify(value: unknown, space?: number): string {
  try {
    return JSON.stringify(value, null, space)
  } catch {
    return String(value)
  }
}

/**
 * 转换为可序列化对象
 *
 * - Date → ISO 字符串
 * - Error → { name, message, stack }
 * - function → undefined
 */
export function toSerializable(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }
  if (typeof value === "function") {
    return undefined
  }
  return value
}
