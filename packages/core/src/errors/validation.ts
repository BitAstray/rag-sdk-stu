import { RagError } from "./base.js"

export class ValidationError extends RagError {
  constructor(message: string, cause?: unknown) {
    super(message, "VALIDATION_ERROR", cause)
  }
}
