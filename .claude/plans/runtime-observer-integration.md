# Runtime Observer 接入计划

## 概述

将 observability 包的 observer 能力接入 runtime 包，实现运行时链路观测。

## 设计决策

1. **Observer 可选** - 不传 observer 时不改变现有行为
2. **Runtime 不依赖具体 exporter** - 只依赖 `@rag-sdk/observability` 的类型
3. **事件发射在 DAG 节点边界** - 每个节点执行前后发射事件
4. **Trace 生命周期由 Observer 管理** - runtime 只负责发射事件

## API 变更

### 1. RuntimeConfig 扩展

```typescript
import type { RAGObserver } from "@rag-sdk/observability"

export interface RuntimeConfig {
  nodes: DAGNode[]
  observer?: RAGObserver
}
```

### 2. createDefaultRuntime 扩展

```typescript
export function createDefaultRuntime(config: {
  retriever: Retriever
  generator: Generator
  observer?: RAGObserver
}): Runtime
```

### 3. Runtime.run 扩展

```typescript
export interface RuntimeRunOptions {
  requestId?: string
  trace?: {
    traceId?: string
    tags?: Record<string, string | number | boolean>
  }
}

export interface Runtime {
  run(query: Query, options?: RuntimeRunOptions): Promise<RuntimeResult>
}
```

### 4. DAGExecutionResult 扩展

```typescript
export interface DAGExecutionResult {
  outputs: Record<string, any>
  durationMs: number
  traceId?: string
}
```

## 事件映射

| DAG 阶段 | 事件名 | 说明 |
|---------|--------|------|
| 开始 | `runtime.query.receive` | 接收到查询 |
| preprocessor 完成 | `runtime.query.preprocess` | 预处理完成 |
| retriever 开始 | `runtime.retrieval.start` | 检索开始 |
| retriever 完成 | `runtime.retrieval.complete` | 检索完成 |
| retriever 失败 | `runtime.retrieval.fail` | 检索失败 |
| postprocessor 开始 | `runtime.post_retrieval.start` | 后处理开始 |
| postprocessor 完成 | `runtime.post_retrieval.select` | 后处理完成 |
| postprocessor 失败 | `runtime.post_retrieval.fail` | 后处理失败 |
| generator 开始 | `runtime.generation.start` | 生成开始 |
| generator 完成 | `runtime.generation.complete` | 生成完成 |
| generator 失败 | `runtime.generation.fail` | 生成失败 |
| 全部完成 | `runtime.run.complete` | 运行完成 |
| 任意失败 | `runtime.run.fail` | 运行失败 |

## 实现步骤

1. 添加 `@rag-sdk/observability` 依赖到 runtime 包
2. 创建 `runtime/src/observer/emit.ts` - 事件发射辅助函数
3. 修改 `runtime/src/pipeline/create-runtime.ts` - 扩展 RuntimeConfig 和 Runtime
4. 修改 `runtime/src/pipeline/dag.ts` - 在节点边界发射事件
5. 修改 `runtime/src/defaults/create-default-runtime.ts` - 传递 observer
6. 更新 `runtime/src/spec/runtime-result.ts` - 添加 traceId
7. 更新 `runtime/src/index.ts` - 导出新类型
8. 创建 demo 验证

## 文件变更

- `packages/runtime/package.json` - 添加依赖
- `packages/runtime/src/pipeline/create-runtime.ts` - 扩展接口
- `packages/runtime/src/pipeline/dag.ts` - 集成 observer
- `packages/runtime/src/defaults/create-default-runtime.ts` - 传递 observer
- `packages/runtime/src/observer/emit.ts` - 新增事件发射
- `packages/runtime/src/observer/index.ts` - 新增导出
- `packages/runtime/src/index.ts` - 更新导出
- `packages/runtime/demo/observer.ts` - 新增 demo

## 验证标准

- [ ] 不传 observer 时行为不变
- [ ] 传 observer 时能接收到事件
- [ ] 事件名符合 `<scope>.<stage>.<action>` 规范
- [ ] 错误事件能正确发射
- [ ] tsgo 类型检查通过
- [ ] demo 运行成功
