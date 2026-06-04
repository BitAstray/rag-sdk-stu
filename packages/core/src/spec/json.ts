/**
 * JSON-safe 原始类型
 */
export type JsonPrimitive = string | number | boolean | null

/**
 * JSON-safe 值类型（支持嵌套）
 */
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

/**
 * JSON-safe 对象类型
 */
export type JsonObject = { [key: string]: JsonValue }
