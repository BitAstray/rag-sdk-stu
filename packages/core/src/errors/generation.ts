import { RagError } from "./base.js"

export class GenerationError extends RagError {
  constructor(message: string, cause?: unknown) {
    super(message, "GENERATION_ERROR", cause)
  }
}
