import type { Chunk } from "@rag-sdk/core"
import { normalizeMetadata, mergeMetadata } from "../../shared/metadata.js"
import type { LcDocumentLike } from "./document-mapper.js"

/**
 * Convert a LangChain splitter output Document to an internal Chunk.
 * Automatically assigns id, sourceDocumentId, and chunkIndex.
 */
export function lcDocumentToChunk(
  lcDoc: LcDocumentLike,
  sourceDocumentId: string,
  chunkIndex: number,
): Chunk {
  const lcMeta = normalizeMetadata(lcDoc.metadata ?? {})
  const enrichedMeta = mergeMetadata(lcMeta, {
    sourceDocumentId,
    chunkIndex: String(chunkIndex),
  })

  return {
    id: `${sourceDocumentId}::${chunkIndex}`,
    content: lcDoc.pageContent,
    metadata: enrichedMeta,
  }
}
