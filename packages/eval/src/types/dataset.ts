/**
 * 评估数据集
 */
export interface EvalDataset {
  id: string
  name: string
  version: string
  samples: EvalSample[]
  metadata?: Record<string, unknown>
}

/**
 * 评估样本
 */
export interface EvalSample {
  id: string
  query: string
  expectedAnswer?: string
  expectedChunks?: string[]
  metadata?: Record<string, unknown>
}

/**
 * 数据集配置
 */
export interface DatasetConfig {
  id: string
  name: string
  version: string
  source: "file" | "memory" | "remote"
  path?: string
  metadata?: Record<string, unknown>
}
