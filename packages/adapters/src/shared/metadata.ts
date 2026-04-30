/**
 * The type that MetadataValue Zod schema resolves to.
 * Defined inline to avoid requiring zod as a dependency.
 */
export type MetadataValueT = string | number | boolean | null | string[]

/**
 * Convert any JS value to a valid MetadataValue.
 * Returns undefined for values that should be omitted (e.g. undefined).
 */
export function normalizeMetadataValue(value: unknown): MetadataValueT | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === "string") return value
  if (typeof value === "number") return value
  if (typeof value === "boolean") return value

  if (value instanceof Date) return value.toISOString()
  if (value instanceof URL) return value.toString()
  if (typeof value === "bigint") return value.toString()

  if (Array.isArray(value)) {
    if (value.length === 0) return []
    if (value.every((v) => typeof v === "string")) return value as string[]
    if (value.every((v) => typeof v === "number")) return value.map(String)
    if (value.every((v) => typeof v === "boolean")) return value.map(String)
    return JSON.stringify(value)
  }

  if (typeof value === "object") return JSON.stringify(value)

  return String(value)
}

/**
 * Normalize all values in a metadata record.
 * Drops keys whose values normalize to undefined.
 */
export function normalizeMetadata(
  meta: Record<string, unknown>,
): Record<string, MetadataValueT> {
  const result: Record<string, MetadataValueT> = {}
  for (const [key, value] of Object.entries(meta)) {
    const normalized = normalizeMetadataValue(value)
    if (normalized !== undefined) {
      result[key] = normalized
    }
  }
  return result
}

/**
 * Shallow merge two metadata records. Override wins.
 * Returns {} if both are empty/undefined.
 */
export function mergeMetadata(
  base: Record<string, MetadataValueT> | undefined,
  override: Record<string, MetadataValueT> | undefined,
): Record<string, MetadataValueT> {
  return { ...base, ...override }
}
