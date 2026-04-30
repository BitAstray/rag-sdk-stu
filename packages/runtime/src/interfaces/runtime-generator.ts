import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../types/preprocessed-query.js"
import type { RuntimeContext } from "../types/context.js"

export interface RuntimeGeneratorResult {
  answer: string | null
  debug?: Record<string, unknown>
}

export interface RuntimeGenerator {
  readonly __runtimeGenerator?: true
  generate(
    query: PreprocessedQuery,
    chunks: Chunk[],
    promptContext: string | null,
    context: RuntimeContext,
  ): Promise<RuntimeGeneratorResult>
}
