/**
 * 字段路径模式
 */
export interface FieldPathPattern {
  type: "exact" | "regex"
  pattern: string | RegExp
}

/**
 * 解析字段路径
 *
 * 如果包含正则表达式元字符，则作为正则处理
 * 否则作为精确匹配
 */
export function parseFieldPath(path: string): FieldPathPattern {
  if (/[\[\]{}()+*?^$|\\]/.test(path)) {
    return { type: "regex", pattern: new RegExp(path) }
  }
  return { type: "exact", pattern: path }
}

/**
 * 检查对象路径是否匹配模式
 */
export function matchesFieldPath(
  objectPath: string,
  patterns: FieldPathPattern[]
): boolean {
  return patterns.some((p) => {
    if (p.type === "exact") {
      return objectPath === p.pattern
    }
    return (p.pattern as RegExp).test(objectPath)
  })
}
