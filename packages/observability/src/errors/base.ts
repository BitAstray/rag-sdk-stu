/**
 * Observability 内部错误基类
 */
export class ObservabilityError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = "ObservabilityError"
  }
}
