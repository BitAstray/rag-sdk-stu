/**
 * Trace 与 Eval 的关联
 *
 * 用于从 observability trace 中提取 eval 相关信息
 */
export interface TraceEvalLink {
  traceId: string
  sampleId: string
  dataset: string
  version: string
}

/**
 * 从 Trace 提取的 Eval 样本
 *
 * 用于从 observability trace 中生成 eval 样本
 */
export interface TraceEvalSample {
  traceId: string
  sampleId?: string
  dataset?: string
  version?: string
  query: string
  answer?: string
  candidates?: TraceCandidate[]
  droppedReasons?: Record<string, number>
  emptyRetrieval?: boolean
  lowConfidence?: boolean
  metadata?: Record<string, unknown>
}

/**
 * 从 Trace 提取的 Candidate 信息
 */
export interface TraceCandidate {
  id: string
  score?: number
  sourceId?: string
  selected: boolean
  dropReason?: string
}

/**
 * Trace 质量信号
 *
 * 用于识别需要关注的 trace
 */
export interface TraceQualitySignals {
  emptyRetrieval: boolean
  lowConfidence: boolean
  highDropRate: boolean
  errorOccurred: boolean
}
