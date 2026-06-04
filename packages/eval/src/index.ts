// Types
export type {
  EvalDataset,
  EvalSample,
  DatasetConfig,
} from "./types/dataset.js"

export type {
  EvalResult,
  EvalRunResult,
  EvalSummary,
  ScoreStats,
  EvalConfig,
} from "./types/result.js"

export type {
  TraceEvalLink,
  TraceEvalSample,
  TraceCandidate,
  TraceQualitySignals,
} from "./types/trace-link.js"

// Metrics
export {
  RecallAtK,
  ReciprocalRank,
  AnswerPresence,
  defaultMetrics,
  resolveMetrics,
} from "./metrics/index.js"
export type { Metric } from "./metrics/index.js"

// Judges
export { HeuristicJudge } from "./judges/index.js"
export type { Judge } from "./judges/index.js"

// Runner
export { Runner, summarize } from "./runner/index.js"
export type { EvalPipeline, RunnerOptions } from "./runner/index.js"

// Trace extraction
export { extractQualitySignals, extractEvalSample } from "./trace/index.js"

