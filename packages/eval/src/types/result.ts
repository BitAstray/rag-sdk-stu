/**
 * 单个样本的评估结果
 */
export interface EvalResult {
  datasetId: string
  datasetVersion: string
  traceId: string
  sampleId: string
  scores: Record<string, number>
  metadata?: Record<string, unknown>
}

/**
 * 评估运行结果
 */
export interface EvalRunResult {
  datasetId: string
  datasetVersion: string
  runId: string
  startedAt: string
  endedAt: string
  results: EvalResult[]
  summary: EvalSummary
}

/**
 * 评估汇总
 */
export interface EvalSummary {
  totalSamples: number
  scores: Record<string, ScoreStats>
}

/**
 * 分数统计
 */
export interface ScoreStats {
  mean: number
  min: number
  max: number
  std: number
}

/**
 * 评估配置
 */
export interface EvalConfig {
  datasetId: string
  metrics: string[]
  concurrency?: number
  timeout?: number
  metadata?: Record<string, unknown>
}
