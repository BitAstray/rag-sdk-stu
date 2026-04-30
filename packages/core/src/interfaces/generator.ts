import type { Query } from "../types/query.js"
import type { Chunk } from "../types/chunk.js"

export interface Generator {
  generate(input: { query: Query; chunks: Chunk[] }): Promise<string>
}
