/**
 * Sampling 配置
 *
 * 采样决策以 trace 为单位，不是 event 为单位
 */
export interface SamplingOptions {
  /** 采样率，0 到 1，默认 1 */
  rate?: number
  /** 错误 trace 是否始终采样，默认 true */
  alwaysSampleOnError?: boolean
}
