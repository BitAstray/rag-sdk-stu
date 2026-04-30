import type { Query } from "../spec/query.js"
import type { Chunk } from "../spec/chunk.js"

export interface Generator {
  generate(input: { query: Query; chunks: Chunk[] }): Promise<string>
}
