import type { Chunk } from "@rag-sdk/core"
import type { Embedder, Vector } from "./types.js"
import { DEFAULT_VECTOR_DIMENSION } from "../defaults/index.js"

export interface MockEmbedderOptions {
  dimension?: number
}

export class MockEmbedder implements Embedder {
  private readonly dimension: number

  constructor(options?: MockEmbedderOptions) {
    this.dimension = options?.dimension ?? DEFAULT_VECTOR_DIMENSION
  }

  async embed(chunks: Chunk[]): Promise<Vector[]> {
    return chunks.map((chunk) => {
      const values = this.hashToVector(chunk.content)
      return {
        id: chunk.id,
        values,
        metadata: { chunkId: chunk.id },
      }
    })
  }

  private hashToVector(text: string): number[] {
    const values = new Array<number>(this.dimension).fill(0)
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)
      values[i % this.dimension] += code
    }
    // normalize
    const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0))
    if (magnitude === 0) return values
    return values.map((v) => v / magnitude)
  }
}
