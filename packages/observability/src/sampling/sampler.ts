import type { SamplingOptions } from "../types/sampling.js"

/**
 * Sampling Middleware
 *
 * 采样决策以 trace 为单位，不是 event 为单位
 * 未被采样的 trace 不应进入 exporter
 */
export interface SamplingMiddleware {
  shouldSample(isError: boolean): boolean
}

/**
 * 创建 Sampling Middleware
 *
 * 先采样再脱敏，未被采样的 trace 直接丢弃
 */
export function createSamplingMiddleware(
  options: SamplingOptions = {}
): SamplingMiddleware {
  const { rate = 1, alwaysSampleOnError = true } = options

  // 参数校验
  if (rate < 0 || rate > 1) {
    throw new Error(`Sampling rate must be between 0 and 1, got ${rate}`)
  }

  return {
    shouldSample(isError: boolean): boolean {
      // 错误 trace 始终采样
      if (isError && alwaysSampleOnError) {
        return true
      }

      // 按 rate 采样
      return Math.random() < rate
    },
  }
}
