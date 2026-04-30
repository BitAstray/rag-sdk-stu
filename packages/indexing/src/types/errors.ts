import { RagError } from "@rag-sdk/core"

export class IndexingError extends RagError {
  readonly stage: string

  constructor(message: string, stage: string, cause?: unknown) {
    super(message, "INDEXING_ERROR", cause)
    this.stage = stage
  }
}
