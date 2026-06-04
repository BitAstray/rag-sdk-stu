import type { Query, RAGResponse } from "@rag-sdk/core"
import { createId } from "@rag-sdk/utils"
import type { EvalDataset, EvalSample } from "../types/dataset.js"
import type { EvalResult, EvalRunResult, EvalSummary, ScoreStats } from "../types/result.js"
import type { Metric } from "../metrics/index.js"
import { defaultMetrics, resolveMetrics } from "../metrics/index.js"
import type { Judge } from "../judges/index.js"

/**
 * 被评估的 Pipeline
 *
 * 通过依赖注入传入，eval 不直接依赖 runtime。任何 (Query) => RAGResponse
 * 的实现都可被评估，包括 Runtime.run 的适配。
 */
export type EvalPipeline = (query: Query) => Promise<RAGResponse> | RAGResponse

export interface RunnerOptions {
  /** 按名选择指标；缺省用全部内置指标 */
  metrics?: string[]
  /** 自定义指标注册表（用于扩展或覆盖内置指标） */
  metricRegistry?: Metric[]
  /** 可选评判器，分数会并入每个样本的 scores */
  judges?: Judge[]
  /** 时间戳来源；缺省用固定空串，便于确定性测试 */
  now?: () => string
}

/**
 * Runner
 *
 * 加载 Dataset，对每个 Sample 执行注入的 Pipeline，收集 Metric/Judge 分数，
 * 汇总成 EvalRunResult。
 */
export class Runner {
  private readonly metrics: Metric[]
  private readonly judges: Judge[]
  private readonly now: () => string

  constructor(options: RunnerOptions = {}) {
    this.metrics = options.metrics
      ? resolveMetrics(options.metrics, options.metricRegistry ?? defaultMetrics())
      : options.metricRegistry ?? defaultMetrics()
    this.judges = options.judges ?? []
    this.now = options.now ?? (() => "")
  }

  async run(dataset: EvalDataset, pipeline: EvalPipeline): Promise<EvalRunResult> {
    const runId = createId("run")
    const startedAt = this.now()

    const results: EvalResult[] = []
    for (const sample of dataset.samples) {
      results.push(await this.evaluateSample(dataset, sample, pipeline))
    }

    return {
      datasetId: dataset.id,
      datasetVersion: dataset.version,
      runId,
      startedAt,
      endedAt: this.now(),
      results,
      summary: summarize(results),
    }
  }

  private async evaluateSample(
    dataset: EvalDataset,
    sample: EvalSample,
    pipeline: EvalPipeline
  ): Promise<EvalResult> {
    const output = await pipeline({ query: sample.query })

    const scores: Record<string, number> = {}
    for (const metric of this.metrics) {
      scores[metric.name] = metric.evaluate(sample, output)
    }
    for (const judge of this.judges) {
      const judged = await judge.judge(sample, output)
      for (const [key, value] of Object.entries(judged)) {
        scores[`${judge.name}.${key}`] = value
      }
    }

    return {
      datasetId: dataset.id,
      datasetVersion: dataset.version,
      traceId: createId("trace"),
      sampleId: sample.id,
      scores,
    }
  }
}

/**
 * 把逐样本结果汇总为均值/极值/标准差。
 */
export function summarize(results: EvalResult[]): EvalSummary {
  const byMetric = new Map<string, number[]>()
  for (const result of results) {
    for (const [name, value] of Object.entries(result.scores)) {
      const list = byMetric.get(name) ?? []
      list.push(value)
      byMetric.set(name, list)
    }
  }

  const scores: Record<string, ScoreStats> = {}
  for (const [name, values] of byMetric) {
    scores[name] = stats(values)
  }

  return { totalSamples: results.length, scores }
}

function stats(values: number[]): ScoreStats {
  const n = values.length
  if (n === 0) return { mean: 0, min: 0, max: 0, std: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  return {
    mean,
    min: Math.min(...values),
    max: Math.max(...values),
    std: Math.sqrt(variance),
  }
}
