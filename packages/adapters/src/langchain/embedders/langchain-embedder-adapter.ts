import type { Embedder } from "@rag-sdk/indexing"
import type { Chunk, Vector } from "@rag-sdk/core"

/** Minimal embeddings interface (avoids hard dep on @langchain/core). */
export interface EmbeddingsLike {
  embedDocuments(texts: string[]): Promise<number[][]>
}

export interface LangChainEmbedderAdapterOptions {
  embeddings: EmbeddingsLike
}

/**
 * Wraps a LangChain-style embeddings object, converting
 * Chunks to Vectors.
 */
export class LangChainEmbedderAdapter implements Embedder {
  private readonly embeddings: EmbeddingsLike

  constructor(options: LangChainEmbedderAdapterOptions) {
    this.embeddings = options.embeddings
  }

  async embed(chunks: Chunk[]): Promise<Vector[]> {
    if (chunks.length === 0) return []

    const texts = chunks.map((c) => c.content)
    const vectors = await this.embeddings.embedDocuments(texts)

    if (vectors.length !== chunks.length) {
      throw new Error(
        `Embedder returned ${vectors.length} vectors for ${chunks.length} chunks`,
      )
    }

    return chunks.map((chunk, i) => ({
      id: chunk.id,
      values: vectors[i],
      metadata: chunk.metadata,
    }))
  }
}
