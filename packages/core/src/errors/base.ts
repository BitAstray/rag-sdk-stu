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
