import type { Chunk, Vector } from "@rag-sdk/core"

export type { Vector } from "@rag-sdk/core"

export interface Embedder {
  embed(chunks: Chunk[]): Promise<Vector[]>
}
