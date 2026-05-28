# @rag-sdk/observability

RAG 链路观测与诊断层。结构化记录 RAG 运行时证据，回答三个核心问题：

- 为什么答成这样？
- 哪里慢/哪里失败？
- 质量怎么持续改进？

## 安装

```bash
pnpm add @rag-sdk/observability
```

## 快速开始

### 最简单的接入方式

```typescript
import { createDefaultRuntime } from "@rag-sdk/runtime"
import { createConsoleObserver } from "@rag-sdk/observability"

const observer = createConsoleObserver({ level: "info" })

// 传给 runtime
const runtime = createDefaultRuntime({
  retriever,
  generator,
  observer,
})

const result = await runtime.run({ query: "公司年假政策是什么？" })
```

### 使用 RAGObserver

```typescript
import { createDefaultRuntime } from "@rag-sdk/runtime"
import {
  createRAGObserver,
  createConsoleExporter,
  createMemoryTraceExporter,
} from "@rag-sdk/observability"

const memoryExporter = createMemoryTraceExporter()

const observer = createRAGObserver({
  exporters: [
    createConsoleExporter({ level: "info" }),
    memoryExporter,
  ],
  sampling: {
    rate: 1,
    alwaysSampleOnError: true,
  },
  redact: {
    fields: ["user.email"],
    maskContent: true,
    contentPreviewLength: 200,
  },
})

const runtime = createDefaultRuntime({
  retriever,
  generator,
  observer,
})

const result = await runtime.run(
  { query: "公司年假政策是什么？" },
  {
    requestId: "request-001",
    trace: {
      traceId: "trace-001",
      tags: { app: "internal-kb" },
    },
  }
)

// 获取捕获的 traces
const traces = memoryExporter.getTraces()
console.log(`Captured ${traces.length} traces`)
```

## 核心概念

### Observer

Observer 是统一观察接口，用于接收 RAG 事件、错误和 trace 生命周期通知。

```typescript
import type { RAGObserver } from "@rag-sdk/observability"

const observer: RAGObserver = {
  onEvent(event) {
    console.log(event.name, event.attributes)
  },
  onError(error) {
    console.error(error.error)
  },
  onTraceEnd(trace) {
    console.log(trace.status, trace.durationMs)
  },
}
```

### Exporter

Exporter 负责将 RAGTrace 输出到特定目标。

```typescript
import { createConsoleExporter, createMemoryTraceExporter } from "@rag-sdk/observability"

// Console 输出
const consoleExporter = createConsoleExporter({ level: "info" })

// Memory 存储（用于测试）
const memoryExporter = createMemoryTraceExporter()
const traces = memoryExporter.getTraces()
```

### Redaction

数据脱敏，支持字段路径和正则表达式。

```typescript
const observer = createRAGObserver({
  redact: {
    fields: ["user.email", "metadata.secret"],
    maskContent: true,
    contentPreviewLength: 200,
    replacement: "[REDACTED]",
  },
})
```

### Sampling

采样控制，以 trace 为单位。

```typescript
const observer = createRAGObserver({
  sampling: {
    rate: 0.1, // 10% 采样率
    alwaysSampleOnError: true, // 错误 trace 始终采样
  },
})
```

## 事件命名规范

事件名格式：`<scope>.<stage>.<action>`

- **scope**: `runtime` | `indexing`
- **stage**: 查询、检索、后处理、生成等阶段
- **action**: `receive` | `preprocess` | `start` | `complete` | `fail` | `select` | `drop` | `store`

### Runtime 事件

- `runtime.query.receive`
- `runtime.query.preprocess`
- `runtime.retrieval.start`
- `runtime.retrieval.complete`
- `runtime.retrieval.fail`
- `runtime.post_retrieval.start`
- `runtime.post_retrieval.select`
- `runtime.post_retrieval.fail`
- `runtime.generation.start`
- `runtime.generation.complete`
- `runtime.generation.fail`
- `runtime.run.complete`
- `runtime.run.fail`

### Indexing 集成

```typescript
import { PipelineSteps } from "@rag-sdk/indexing"
import { createConsoleObserver } from "@rag-sdk/observability"

const observer = createConsoleObserver({ level: "info" })

const result = await PipelineSteps
  .fromLoader(
    { load: async () => documents },
    {
      observer,
      trace: {
        traceId: "indexing-001",
        dataset: "company-handbook",
        version: "v1",
      },
    }
  )
  .pipe(PipelineSteps.chunk(chunker), "chunk")
  .pipe(PipelineSteps.embed(embedder), "embed")
  .pipe(PipelineSteps.store(vectorStore), "store")
  .consume()
```

### Indexing 事件

- `indexing.run.start`
- `indexing.run.complete`
- `indexing.run.fail`
- `indexing.load.start`
- `indexing.load.complete`
- `indexing.load.fail`
- `indexing.transform.complete`
- `indexing.filter.complete`
- `indexing.chunk.complete`
- `indexing.embed.complete`
- `indexing.store.complete`

## API

### Observers

- `createNoopObserver()` - 空实现
- `createConsoleObserver(options?)` - Console 输出
- `createRAGObserver(options?)` - 组合 Observer
- `createCompositeObserver(observers)` - 组合多个 Observer
- `wrapObserverWithErrorHandling(observer, onError?)` - 错误隔离

### Exporters

- `createConsoleExporter(options?)` - Console 输出
- `createMemoryTraceExporter()` - Memory 存储

### Utils

- `createTimestamp()` - ISO 时间戳
- `createTraceId()` - Trace ID 生成
- `validateEventName(name)` - 事件名校验
- `isValidEventName(name)` - 事件名校验（类型守卫）

### Types

- `RAGObserver` - Observer 接口
- `TraceExporter` - Exporter 接口
- `RAGEvent` - 事件类型
- `RAGTrace` - Trace 类型
- `RAGMetric` - 指标类型
- `RAGErrorRecord` - 错误记录类型
- `TraceContext` - Trace 上下文
- `RedactionOptions` - Redaction 配置
- `SamplingOptions` - Sampling 配置
- `RAGEventName` - 事件名类型
- `RAGAttributes` - 属性类型

## 设计决策

1. **RAGObserver 与 Hook 独立共存** - Hook 用于管线扩展，Observer 用于观测
2. **数据流向** - Observer → RedactionMiddleware → Exporter
3. **采样时机** - 先采样再脱敏
4. **错误隔离** - Observer 错误不中断主流程
5. **Trace 生命周期** - Observer 内部管理

## 依赖

- `@rag-sdk/core` - 共享类型

## License

MIT
