import type { Document } from "@rag-sdk/core"
import { normalizeMetadata } from "../../shared/metadata.js"
import { generateFallbackId } from "./id.js"

/** Minimal shape of a LangChain Document (avoids hard dep on @langchain/core types). */
export interface LcDocumentLike {
  pageContent: string
  metadata?: Record<string, unknown>
  id?: string
}

/**
 * Convert a LangChain Document to an internal Document.
 * Handles id fallback and metadata normalization.
 */
export function lcDocumentToDocument(
  lcDoc: LcDocumentLike,
  index: number,
): Document {
  return {
    id: lcDoc.id ?? generateFallbackId(lcDoc.pageContent, index),
    content: lcDoc.pageContent,
    metadata: normalizeMetadata(lcDoc.metadata ?? {}),
  }
}

/**
 * Convert an internal Document to a LangChain Document shape.
 * Used when passing internal docs into LC splitters.
 */
export function documentToLcDocument(doc: Document): LcDocumentLike {
  return {
    pageContent: doc.content,
    metadata: doc.metadata ?? {},
  }
}
