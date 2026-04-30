export class RagError extends Error {
  readonly code: string
  readonly cause?: unknown

  constructor(message: string, code: string, cause?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.cause = cause
  }
}

export function createRagError(code: string, message: string, cause?: unknown): RagError {
  return new RagError(message, code, cause)
}
