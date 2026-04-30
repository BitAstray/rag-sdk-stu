import { RagError } from "@rag-sdk/core"

export type RuntimeStage =
  | "pre-retrieval"
  | "retrieval"
  | "post-retrieval"
  | "generation"

export class RuntimeError extends RagError {
  readonly stage: RuntimeStage

  constructor(stage: RuntimeStage, message: string, cause?: unknown) {
    super(message, "RUNTIME_ERROR", cause)
    this.stage = stage
  }
}
