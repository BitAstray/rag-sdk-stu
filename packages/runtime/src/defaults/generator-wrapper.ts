import type { Generator, Chunk } from "@rag-sdk/core"
import type {
  RuntimeGenerator,
  RuntimeGeneratorResult,
} from "../interfaces/runtime-generator.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

export class CoreGeneratorWrapper implements RuntimeGenerator {
  constructor(private readonly inner: Generator) {}

  async generate(
    query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
    _promptContext: string | null,
  ): Promise<RuntimeGeneratorResult> {
    const chunks: Chunk[] = candidates.map(c => ({
      id: c.id,
      content: c.content,
      metadata: c.metadata as Record<string, string | number | boolean | null | string[]> | undefined,
    }))
    const answer = await this.inner.generate({
      query: { query: query.effectiveQuery },
      chunks,
    })
    return { answer }
  }
}
