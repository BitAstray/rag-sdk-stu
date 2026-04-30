import type { Retriever } from "@rag-sdk/core"
import type {
  RuntimeRetriever,
  RuntimeRetrieverResult,
} from "../interfaces/runtime-retriever.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RuntimeContext } from "../spec/context.js"
import { RuntimeError } from "../errors/runtime.js"

export class CoreRetrieverWrapper implements RuntimeRetriever {
  constructor(private readonly inner: Retriever) {}

  async retrieve(
    input: PreprocessedQuery,
    _context: RuntimeContext,
  ): Promise<RuntimeRetrieverResult> {
    try {
      const chunks = await this.inner.retrieve({ query: input.effectiveQuery })
      return { chunks }
    } catch (cause) {
      throw new RuntimeError(
        "retrieval",
        `Core retriever failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      )
    }
  }
}
