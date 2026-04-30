import { RagError } from "./base.js"

export class RetrievalError extends RagError {
  constructor(message: string, cause?: unknown) {
    super(message, "RETRIEVAL_ERROR", cause)
  }
}
