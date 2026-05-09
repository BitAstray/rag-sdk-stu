import type { Retriever } from "@rag-sdk/core"
import type {
  RuntimeRetriever,
  RuntimeRetrieverResult,
} from "../interfaces/runtime-retriever.js"
import type { PreprocessedQuery } from "../spec/preprocessed-query.js"
import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

export class CoreRetrieverWrapper implements RuntimeRetriever {
  constructor(private readonly inner: Retriever) {}

  async retrieve(input: PreprocessedQuery): Promise<RuntimeRetrieverResult> {
    const chunks = await this.inner.retrieve({ query: input.effectiveQuery })
    const candidates: RetrievalCandidate[] = chunks.map(c => ({
      id: c.id,
      content: c.content,
      metadata: c.metadata as Record<string, unknown> | undefined,
    }))
    return { candidates }
  }
}
