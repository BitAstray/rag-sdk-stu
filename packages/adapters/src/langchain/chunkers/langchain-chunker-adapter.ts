import type { Chunker } from "@rag-sdk/indexing"
import type { Document, Chunk } from "@rag-sdk/core"
import type { LcDocumentLike } from "../shared/document-mapper.js"
import { documentToLcDocument } from "../shared/document-mapper.js"
import { lcDocumentToChunk } from "../shared/chunk-mapper.js"

/** Minimal splitter interface (avoids hard dep on @langchain/core). */
export interface SplitterLike {
  splitDocuments(docs: LcDocumentLike[]): Promise<LcDocumentLike[]>
}

export interface LangChainChunkerAdapterOptions {
  splitter: SplitterLike
}

/**
 * Wraps a LangChain-style text splitter, converting between
 * internal Documents/Chunks and LC documents.
 */
export class LangChainChunkerAdapter implements Chunker {
  private readonly splitter: SplitterLike

  constructor(options: LangChainChunkerAdapterOptions) {
    this.splitter = options.splitter
  }

  async chunk(doc: Document): Promise<Chunk[]> {
    const lcDoc = documentToLcDocument(doc)
    const lcChunks = await this.splitter.splitDocuments([lcDoc])

    const chunks: Chunk[] = []
    let chunkIndex = 0
    for (const lcChunk of lcChunks) {
      const content = lcChunk.pageContent.trim()
      if (!content) continue
      chunks.push(lcDocumentToChunk(lcChunk, doc.id, chunkIndex))
      chunkIndex++
    }
    return chunks
  }
}
