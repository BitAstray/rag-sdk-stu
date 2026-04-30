import type { Vector } from "@rag-sdk/core"

export interface VectorStore {
  upsert(vectors: Vector[]): Promise<void>
}
