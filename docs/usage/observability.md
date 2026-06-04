# 可观测性 (Observability)

> 如果你还没跑通快速上手，先看 [SDK 使用者指南](./sdk-user.md)。

可观测性包 `@rag-sdk/observability` 为 RAG 管线提供了无侵入的 Trace 和 Metric 收集能力。它采用了显式的生命周期闭合控制。

## RAGObserver

Observer 是观测管线的核心对象，通过 `createRAGObserver` 创建并可以通过中间件实现组合、采样（Sampling）、脱敏（Redaction）以及多目标导出（Exporters）。

### 显式 Trace 生命周期

Observer 要求调用者（即 Runtime 引擎或 Indexing 流管线）进行显式的生命周期包裹，从而让 Trace 追踪系统能够百分百保证状态收敛，而不是依靠猜测：

```ts
import { createRAGObserver, createConsoleExporter } from "@rag-sdk/observability"

const observer = createRAGObserver({
  exporters: [createConsoleExporter()],
})

// 1. 引擎在执行前请求开启一个 Trace，并拿到控制句柄
const traceHandle = observer.startTrace!("my-trace-123", "runtime")

try {
  // 2. 在各个阶段执行并上报过程事件
  observer.onEvent?.({
    name: "runtime.retrieval.start",
    traceId: "my-trace-123",
    scope: "runtime",
    stage: "retrieval",
    timestamp: new Date().toISOString(),
  })
  
  // 3. 正常结束 Trace (ok)
  traceHandle.end("ok")
} catch (err) {
  // 3. 异常结束 Trace (error)
  traceHandle.end("error")
}
```

> 提示：当你使用 `@rag-sdk/runtime` 的 `runtime.run` 或 `@rag-sdk/indexing` 的 `PipelineSteps.consume` 时，引擎已经自动为你接管了这一切，你只需要在创建时把 `observer` 传进去即可。

### 导出到 Exporter

你可以组合多个 `TraceExporter`：

```ts
import { 
  createRAGObserver, 
  createConsoleExporter, 
  createMemoryTraceExporter 
} from "@rag-sdk/observability"

const memoryExporter = createMemoryTraceExporter()

const observer = createRAGObserver({
  exporters: [
    createConsoleExporter(), // 打印到控制台
    memoryExporter,          // 保存在内存供测试获取
  ]
})
```

## 在 RAG 管线中使用

将 Observer 传入相应的工厂函数，引擎即会自动建立 Trace 上下文，并触发各个阶段的事件。

### 在 Runtime 中使用

```ts
import { createDefaultRuntime } from "@rag-sdk/runtime"

const runtime = createDefaultRuntime({
  retriever: myRetriever,
  generator: myGenerator,
  observer: myObserver // 引擎将自动注入并闭合 Trace
})

await runtime.run({ query: "What is RAG?" })
```

### 在 Indexing 中使用

```ts
import { PipelineSteps } from "@rag-sdk/indexing"

await PipelineSteps.fromLoader(myLoader, { 
  observer: myObserver // 流管线将自动管理 Trace 边界
})
  .pipe(PipelineSteps.chunk(myChunker))
  .pipe(PipelineSteps.embed(myEmbedder))
  .pipe(PipelineSteps.store(myStore))
  .consume()
```

## 中间件：脱敏与采样

Observer 内置了安全（脱敏）与成本控制（采样）选项。

### Redaction（脱敏）

RAG 场景下查询和上下文可能包含敏感信息。使用 Redaction 配置阻止指定字段被导出。

```ts
const observer = createRAGObserver({
  exporters: [...],
  redact: {
    fields: ["password", "apiKey", "ssn"],
    contentPreviewLength: 100 // 可选：截断过长的查询字符串
  }
})
```

### Sampling（采样）

当知识库规模极大时，无需导出每一个 Trace。使用 Sampling 控制上传率。

```ts
const observer = createRAGObserver({
  exporters: [...],
  sampling: { 
    rate: 0.05,               // 仅上传 5% 的正常 Trace
    alwaysSampleOnError: true // 但永远百分百上传出现 Error 的 Trace 以便调试
  }
})
```

## 组合多个 Observer

如果你的项目中有针对不同后端的复杂收集逻辑，可以使用 `createCompositeObserver` 并发广播事件：

```ts
import { createCompositeObserver } from "@rag-sdk/observability"

const masterObserver = createCompositeObserver([
  datadogObserver,
  sentryObserver
])
```