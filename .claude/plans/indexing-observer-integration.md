# Indexing Observer 接入计划

## 概述

将 observability 包的 observer 能力接入 indexing 包，实现离线索引链路观测。

## 设计决策

1. **Observer 可选** - 不传 observer 时不改变现有行为
2. **Indexing 不依赖具体 exporter** - 只依赖 `@rag-sdk/observability` 的类型
3. **事件发射在 pipeline 阶段边界** - 每个阶段完成时发射事件
4. **Trace 生命周期由 Observer 管理** - indexing 只负责发射事件

## API 变更

### 1. IndexingOptions 扩展

```typescript
import type { RAGObserver } from "@rag-sdk/observability"

export interface IndexingOptions {
  loader: Loader
  chunker?: Chunker
  embedder: Embedder
  store: VectorStore
  transformer?: DocumentTransformer
  shouldIndex?: (doc: Document, context: IndexingContext) => boolean
  metadataBuilder?: (doc: Document, chunk: Chunk, context: IndexingContext) => Record<string, string | number | boolean | string[] | null>
  onError?: (error: Error, doc: Document | undefined, context: IndexingContext) => void
  observer?: RAGObserver  // 新增
  trace?: {               // 新增
    traceId?: string
    dataset?: string
    version?: string
    tags?: Record<string, string | number | boolean>
  }
}
```

### 2. IndexingResult 扩展

```typescript
export interface IndexingResult {
  totalDocuments: number
  totalChunks: number
  errors: Error[]
  traceId?: string  // 新增
}
```

## 事件映射

| Pipeline 阶段 | 事件名 | 说明 |
|--------------|--------|------|
| 开始 | `indexing.run.start` | 索引开始 |
| loader 完成 | `indexing.load.complete` | 加载完成 |
| loader 失败 | `indexing.load.fail` | 加载失败 |
| transformer 完成 | `indexing.transform.complete` | 转换完成 |
| filter 完成 | `indexing.filter.complete` | 过滤完成 |
| chunker 完成 | `indexing.chunk.complete` | 分块完成 |
| embedder 完成 | `indexing.embed.complete` | 嵌入完成 |
| store 完成 | `indexing.store.complete` | 存储完成 |
| 全部完成 | `indexing.run.complete` | 索引完成 |
| 任意失败 | `indexing.run.fail` | 索引失败 |

## 实现步骤

1. 添加 `@rag-sdk/observability` 依赖到 indexing 包
2. 创建 `indexing/src/observer/emit.ts` - 事件发射辅助函数
3. 修改 `indexing/src/types/index.ts` - 扩展 IndexingOptions 和 IndexingResult
4. 修改 `indexing/src/pipeline/pipeline.ts` - 在阶段边界发射事件
5. 更新 `indexing/src/index.ts` - 导出新类型
6. 创建 demo 验证

## 文件变更

- `packages/indexing/package.json` - 添加依赖
- `packages/indexing/src/types/index.ts` - 扩展接口
- `packages/indexing/src/pipeline/pipeline.ts` - 集成 observer
- `packages/indexing/src/observer/emit.ts` - 新增事件发射
- `packages/indexing/src/observer/index.ts` - 新增导出
- `packages/indexing/src/index.ts` - 更新导出
- `packages/indexing/demo/observer.ts` - 新增 demo

## 验证标准

- [ ] 不传 observer 时行为不变
- [ ] 传 observer 时能接收到事件
- [ ] 事件名符合 `<scope>.<stage>.<action>` 规范
- [ ] 错误事件能正确发射
- [ ] tsgo 类型检查通过
- [ ] demo 运行成功
