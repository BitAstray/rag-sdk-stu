import type { Retriever, Chunk, Query, Vector } from "@rag-sdk/core"
import type { MemoryVectorStore } from "@rag-sdk/indexing"
import { MockEmbedder } from "@rag-sdk/indexing"

export interface InMemoryRetrieverOptions {
  topK?: number
}

export class InMemoryRetriever implements Retriever {
  private readonly chunks = new Map<string, Chunk>()
  private readonly embedder: MockEmbedder
  private readonly topK: number

  constructor(
    private readonly store: MemoryVectorStore,
    options?: InMemoryRetrieverOptions,
  ) {
    this.embedder = new MockEmbedder()
    this.topK = options?.topK ?? 5
  }

  addChunks(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk)
    }
  }

  async retrieve(query: Query): Promise<Chunk[]> {
    const vectors = this.store.getAll()
    if (vectors.length === 0) return []

    const queryChunks: Chunk[] = [{ id: "__query__", content: query.query }]
    const queryVectors = await this.embedder.embed(queryChunks)
    const queryVec = queryVectors[0]!

    const scored = vectors.map((v) => ({
      vector: v,
      score: cosineSimilarity(queryVec.values, v.values),
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, this.topK).flatMap(({ vector }) => {
      const chunkId = vector.metadata?.["chunkId"] as string | undefined
      const chunk = chunkId ? this.chunks.get(chunkId) : undefined
      return chunk ? [chunk] : []
    })
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
