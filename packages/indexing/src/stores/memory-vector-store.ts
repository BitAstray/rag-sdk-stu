import type { Vector } from "@rag-sdk/core"
import type { VectorStore } from "./types.js"

export class MemoryVectorStore implements VectorStore {
  private readonly vectors: Map<string, Vector> = new Map()

  async upsert(vectors: Vector[]): Promise<void> {
    for (const vector of vectors) {
      this.vectors.set(vector.id, vector)
    }
  }

  getAll(): Vector[] {
    return Array.from(this.vectors.values())
  }
}
