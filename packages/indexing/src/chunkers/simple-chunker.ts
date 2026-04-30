import type { Chunk, Document } from "@rag-sdk/core"
import type { Chunker } from "./types.js"
import { DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP } from "../defaults/index.js"

export interface SimpleChunkerOptions {
  chunkSize?: number
  overlap?: number
}

export class SimpleChunker implements Chunker {
  private readonly chunkSize: number
  private readonly overlap: number

  constructor(options?: SimpleChunkerOptions) {
    this.chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE
    this.overlap = options?.overlap ?? DEFAULT_OVERLAP
    if (this.overlap >= this.chunkSize) {
      throw new Error(`overlap (${this.overlap}) must be less than chunkSize (${this.chunkSize})`)
    }
  }

  async chunk(doc: Document): Promise<Chunk[]> {
    if (!doc.content) return []

    const chunks: Chunk[] = []
    const step = this.chunkSize - this.overlap
    let index = 0

    for (let start = 0; start < doc.content.length; start += step) {
      const end = Math.min(start + this.chunkSize, doc.content.length)
      const content = doc.content.slice(start, end)
      chunks.push({
        id: `${doc.id}::${index}`,
        content,
        metadata: { documentId: doc.id, chunkIndex: index },
      })
      index++
    }

    return chunks
  }
}
