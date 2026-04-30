import type { VectorStore } from "@rag-sdk/indexing"
import type { Vector } from "@rag-sdk/core"
import { toChromaMetadata } from "../shared/metadata.js"

/** Minimal Chroma client interface (avoids hard dep on chromadb types). */
export interface ChromaClientLike {
  getOrCreateCollection(options: {
    name: string
    metadata?: Record<string, unknown>
  }): Promise<ChromaCollectionLike>
}

export interface ChromaCollectionLike {
  upsert(options: {
    ids: string[]
    embeddings: number[][]
    metadatas: (Record<string, unknown> | null)[]
  }): Promise<void>
}

export interface ChromaVectorStoreConfig {
  /** Collection name. Required. */
  collectionName: string
  /** Optional collection metadata passed on creation. */
  collectionMetadata?: Record<string, unknown>
  /** Inject a ChromaClient instance (for testing). */
  client?: ChromaClientLike
}

/**
 * Wraps a Chroma client as a VectorStore.
 * Lazily creates the collection on first upsert.
 */
export class ChromaVectorStore implements VectorStore {
  private readonly client: ChromaClientLike
  private readonly collectionName: string
  private readonly collectionMetadata?: Record<string, unknown>
  private collection: ChromaCollectionLike | null = null
  private collectionFailed = false

  constructor(config: ChromaVectorStoreConfig) {
    if (!config.collectionName) {
      throw new Error("collectionName is required")
    }
    if (!config.client) {
      throw new Error(
        "client is required. Pass a ChromaClient instance via config.client.",
      )
    }
    this.client = config.client
    this.collectionName = config.collectionName
    this.collectionMetadata = config.collectionMetadata
  }

  async upsert(vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) return

    // Validate dimension consistency
    const dim = vectors[0].values.length
    for (const v of vectors) {
      if (v.values.length !== dim) {
        throw new Error(
          `Dimension mismatch: expected ${dim}, got ${v.values.length} for vector ${v.id}`,
        )
      }
    }

    const collection = await this.getCollection()

    await collection.upsert({
      ids: vectors.map((v) => v.id),
      embeddings: vectors.map((v) => v.values),
      metadatas: vectors.map((v) => toChromaMetadata(v.metadata) ?? null),
    })
  }

  private async getCollection(): Promise<ChromaCollectionLike> {
    if (this.collection) return this.collection
    if (this.collectionFailed) {
      this.collectionFailed = false
    }

    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: this.collectionMetadata,
      })
      return this.collection
    } catch (error) {
      this.collectionFailed = true
      throw error
    }
  }
}
