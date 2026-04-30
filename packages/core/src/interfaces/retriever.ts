import type { Query } from "../types/query.js"
import type { Chunk } from "../types/chunk.js"

export interface Retriever {
  retrieve(query: Query): Promise<Chunk[]>
}
