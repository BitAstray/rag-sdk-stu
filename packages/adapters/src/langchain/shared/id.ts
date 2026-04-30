import { createHash } from "node:crypto"

/**
 * Generate a deterministic fallback ID from content and index.
 * Uses SHA-256 hash prefix + index for stability across runs.
 */
export function generateFallbackId(content: string, index: number): string {
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16)
  return `${hash}::${index}`
}
