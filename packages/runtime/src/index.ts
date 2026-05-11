// Types & Schemas
export type {
  PreprocessedQuery,
  RetrievalCandidate,
  SelectionTraceItem,
  PreRetrievalResult,
  RetrievalResult,
  PostRetrievalResult,
  GenerationResult,
  AppliedBudget,
  RuntimeContext,
  RuntimeResult,
  RetrievalDebugData,
  PostRetrievalDebugData,
  GenerationDebugData,
  RuntimeMetadata,
} from "./spec/index.js"
export {
  PreprocessedQuerySchema,
  RetrievalCandidateSchema,
  SelectionTraceItemSchema,
  PreRetrievalResultSchema,
  RetrievalResultSchema,
  PostRetrievalResultSchema,
  GenerationResultSchema,
  AppliedBudgetSchema,
  RuntimeContextSchema,
  RuntimeResultSchema,
} from "./spec/index.js"

// Interfaces
export type {
  QueryPreprocessor,
  RuntimeRetriever,
  RuntimeRetrieverResult,
  RetrievalPostprocessor,
  RetrievalPostprocessorResult,
  SelectionDetail,
  RuntimeGenerator,
  RuntimeGeneratorResult,
} from "./interfaces/index.js"

// Strategies
export type { CandidatePredicate } from "./defaults/postprocessor/strategies.js"

// Errors
export { RuntimeError, wrapStageError } from "./errors/runtime.js"
export type { RuntimeStage } from "./errors/runtime.js"

// Pipeline
export { createRuntime } from "./pipeline/create-runtime.js"
export type { RuntimeConfig, Runtime } from "./pipeline/create-runtime.js"
export { executeDAG } from "./pipeline/dag.js"
export type { DAGNode, DAGExecutionResult } from "./pipeline/dag.js"

// Defaults
export { NoopQueryPreprocessor } from "./defaults/noop-query-preprocessor.js"
export { PassthroughRetrievalPostprocessor } from "./defaults/passthrough-postprocessor.js"
export { createPostprocessorPipeline } from "./defaults/postprocessor/pipeline.js"
export type { PostprocessorStep, PostprocessorContext } from "./defaults/postprocessor/pipeline.js"
export { 
  scoreThreshold, 
  budgetTrim, 
  predicateFilter, 
  nearDuplicateRemoval, 
  sourceCoverage 
} from "./defaults/postprocessor/strategies.js"
export { contextOrdering } from "./defaults/postprocessor/context-ordering.js"
export { createDefaultRuntime } from "./defaults/create-default-runtime.js"
export { CoreRetrieverWrapper } from "./defaults/retriever-wrapper.js"
export { CoreGeneratorWrapper } from "./defaults/generator-wrapper.js"
