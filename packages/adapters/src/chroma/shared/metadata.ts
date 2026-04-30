import type { MetadataValueT } from "../../shared/metadata.js"

/** Chroma-compatible metadata value types. */
export type ChromaMetadataValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[]

/**
 * Convert SDK MetadataValue record to Chroma-compatible metadata.
 * Returns undefined for empty/undefined input (Chroma accepts null entries).
 */
export function toChromaMetadata(
  meta: Record<string, MetadataValueT> | undefined,
): Record<string, ChromaMetadataValue> | undefined {
  if (!meta || Object.keys(meta).length === 0) return undefined

  const result: Record<string, ChromaMetadataValue> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value
    } else if (Array.isArray(value)) {
      result[key] = value
    } else {
      result[key] = JSON.stringify(value)
    }
  }
  return result
}
