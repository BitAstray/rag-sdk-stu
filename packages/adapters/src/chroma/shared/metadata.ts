import { normalizeMetadata } from "../../shared/metadata.js"
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
 *
 * Narrowing is owned by the shared `normalizeMetadata`; every MetadataValueT it
 * produces is already a valid ChromaMetadataValue. This adapter only adds Chroma's
 * contract: empty/undefined input maps to undefined (Chroma accepts null entries).
 */
export function toChromaMetadata(
  meta: Record<string, MetadataValueT> | undefined,
): Record<string, ChromaMetadataValue> | undefined {
  if (!meta || Object.keys(meta).length === 0) return undefined
  return normalizeMetadata(meta)
}
