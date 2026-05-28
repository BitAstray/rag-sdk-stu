# Eval 数据闭环计划

## 概述

为 eval 包添加基础类型定义，预留与 observability 的关联字段，确保 trace 数据结构能被 eval 消费。

## 设计决策

1. **Eval 包保持骨架** - 当前阶段不实现完整 eval 功能
2. **预留关联字段** - 确保 observability 的 trace 包含 eval 需要的字段
3. **类型定义先行** - 为未来 eval 实现阶段提供类型基础

## Observability 已预留的关联字段

根据设计文档，observability 的 trace 已包含以下 eval 关联字段：

```typescript
interface RAGTrace {
  traceId: string
  sampleId?: string
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
  // ...
}

interface TraceContext {
  traceId: string
  sampleId?: string
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
  // ...
}
```

## Eval 包需要的类型

### 1. EvalDataset

```typescript
interface EvalDataset {
  id: string
  name: string
  version: string
  samples: EvalSample[]
  metadata?: Record<string, unknown>
}

interface EvalSample {
  id: string
  query: string
  expectedAnswer?: string
  expectedChunks?: string[]
  metadata?: Record<string, unknown>
}
```

### 2. EvalResult

```typescript
interface EvalResult {
  datasetId: string
  datasetVersion: string
  traceId: string
  sampleId: string
  scores: Record<string, number>
  metadata?: Record<string, unknown>
}

interface EvalRunResult {
  datasetId: string
  datasetVersion: string
  runId: string
  startedAt: string
  endedAt: string
  results: EvalResult[]
  summary: EvalSummary
}

interface EvalSummary {
  totalSamples: number
  scores: Record<string, { mean: number; min: number; max: number; std: number }>
}
```

### 3. Trace 与 Eval 的关联

```typescript
interface TraceEvalLink {
  traceId: string
  sampleId: string
  dataset: string
  version: string
}
```

## 实现步骤

1. 添加 `@rag-sdk/observability` 依赖到 eval 包
2. 创建 `eval/src/types/dataset.ts` - 数据集类型
3. 创建 `eval/src/types/result.ts` - 评估结果类型
4. 创建 `eval/src/types/trace-link.ts` - Trace 关联类型
5. 更新 `eval/src/types/index.ts` - 导出新类型
6. 更新 `eval/src/index.ts` - 导出新类型
7. 更新文档

## 文件变更

- `packages/eval/package.json` - 添加依赖
- `packages/eval/src/types/dataset.ts` - 新增数据集类型
- `packages/eval/src/types/result.ts` - 新增评估结果类型
- `packages/eval/src/types/trace-link.ts` - 新增 Trace 关联类型
- `packages/eval/src/types/index.ts` - 新增导出
- `packages/eval/src/index.ts` - 更新导出
- `packages/eval/CONTEXT.md` - 更新文档

## 验证标准

- [ ] 类型定义完整
- [ ] 与 observability 的关联字段一致
- [ ] tsgo 类型检查通过
- [ ] 文档更新
