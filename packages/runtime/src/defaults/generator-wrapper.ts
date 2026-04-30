import type { Generator, Chunk } from "@rag-sdk/core"
import type {
  RuntimeGenerator,
  RuntimeGeneratorResult,
} from "../interfaces/runtime-generator.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RuntimeContext } from "../spec/context.js"
import { RuntimeError } from "../errors/runtime.js"

export class CoreGeneratorWrapper implements RuntimeGenerator {
  constructor(private readonly inner: Generator) {}

  async generate(
    query: PreprocessedQuery,
    chunks: Chunk[],
    _promptContext: string | null,
    _context: RuntimeContext,
  ): Promise<RuntimeGeneratorResult> {
    try {
      const answer = await this.inner.generate({
        query: { query: query.effectiveQuery },
        chunks,
      })
      return { answer }
    } catch (cause) {
      throw new RuntimeError(
        "generation",
        `Core generator failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      )
    }
  }
}
