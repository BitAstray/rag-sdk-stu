import type { Query } from "../spec/query.js"
import type { Chunk } from "../spec/chunk.js"

export interface Retriever {
  retrieve(query: Query): Promise<Chunk[]>
}
