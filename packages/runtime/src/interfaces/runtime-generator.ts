import type { Chunk } from "@rag-sdk/core"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RuntimeContext } from "../spec/context.js"
import type { GenerationDebugData } from "../spec/debug.js"

export interface RuntimeGeneratorResult {
  answer: string | null
  debug?: GenerationDebugData
}

export interface RuntimeGenerator {
  generate(
    query: PreprocessedQuery,
    chunks: Chunk[],
    promptContext: string | null,
    context: RuntimeContext,
  ): Promise<RuntimeGeneratorResult>
}
