# SDK 使用者指南

RAG SDK 是一个模块化的 TypeScript 框架，用于构建检索增强生成（RAG）应用。本文档帮你 5 分钟跑通整个流程。

## 安装

```bash
# 核心类型（必须）
pnpm add @rag-sdk/core

# 运行时管线
pnpm add @rag-sdk/runtime

# 索引管线
pnpm add @rag-sdk/indexing

# 外部服务适配器（可选）
pnpm add @rag-sdk/adapters
```

## 快速上手

下面的示例使用内存组件，copy-paste 即可运行，无需外部服务。

### 1. 索引数据

```ts
import { PipelineSteps, SimpleChunker, MockEmbedder, MemoryVectorStore } from "@rag-sdk/indexing"
import type { Document } from "@rag-sdk/core"

// 准备文档
const docs: Document[] = [
  { id: "doc-1", content: "TypeScript is a typed superset of JavaScript." },
  { id: "doc-2", content: "RAG combines retrieval with text generation." },
]

// 创建内存向量存储
const store = new MemoryVectorStore()

// 执行索引管线：加载 → 分块 → 嵌入 → 存储
const indexResult = await PipelineSteps.fromLoader({ load: async () => docs })
  .pipe(PipelineSteps.chunk(new SimpleChunker()))
  .pipe(PipelineSteps.embed(new MockEmbedder()))
  .pipe(PipelineSteps.store(store))
  .consume()

console.log(`Indexed ${indexResult.totalDocuments} documents, ${indexResult.totalChunks} chunks`)
```

### 2. 查询

```ts
import { createDefaultRuntime } from "@rag-sdk/runtime"
import type { Retriever, Generator, Query } from "@rag-sdk/core"

// 实现 Retriever：从向量存储中检索
const retriever: Retriever = {
  async retrieve(query: Query) {
    return store.search(query.query, { topK: 5 })
  },
}

// 实现 Generator：基于检索结果生成回答
const generator: Generator = {
  async generate({ query, chunks }) {
    const context = chunks.map((c) => c.content).join("\n")
    return `Based on: ${context}\n\nAnswer to "${query.query}": [your LLM call here]`
  },
}

// 创建运行时并执行
const runtime = createDefaultRuntime({ retriever, generator })
const result = await runtime.run({ query: "What is TypeScript?" })

// 访问结果
const answer = result.outputs.generator.value.answer
const candidates = result.outputs.postprocessor.value.candidates

console.log("Answer:", answer)
console.log("Sources:", candidates.map((c) => c.id))
console.log(`Duration: ${result.durationMs}ms`)
```

### 返回值结构

`runtime.run()` 返回 `DAGExecutionResult`：

```ts
interface DAGExecutionResult {
  outputs: {
    preprocessor: { value: PreprocessedQuery; durationMs: number }
    retriever:    { value: RuntimeRetrieverResult; durationMs: number }
    postprocessor:{ value: RetrievalPostprocessorResult; durationMs: number }
    generator:    { value: RuntimeGeneratorResult; durationMs: number }
  }
  durationMs: number
}
```

常用访问路径：

| 字段 | 路径 |
|------|------|
| 生成的回答 | `result.outputs.generator.value.answer` |
| 检索到的候选 | `result.outputs.postprocessor.value.candidates` |
| 后处理详情 | `result.outputs.postprocessor.value.detail` |
| 总耗时 | `result.durationMs` |

## 核心数据类型

```ts
// 查询请求
interface Query { query: string }

// 原始文档
interface Document { id: string; content: string; metadata?: Record<string, MetadataValue> }

// 切分后的片段
interface Chunk { id: string; content: string; metadata?: Record<string, MetadataValue> }

// 向量表示
interface Vector { id: string; values: number[]; metadata?: Record<string, MetadataValue> }

// 元数据值类型
type MetadataValue = string | number | boolean | null | string[]
```

## 包说明

| 包 | 用途 | 必须安装 |
|---|---|---|
| `@rag-sdk/core` | 共享类型（Document, Chunk, Vector, Query） | 是 |
| `@rag-sdk/runtime` | 在线查询编排（4 阶段管线） | 按需 |
| `@rag-sdk/indexing` | 离线索引构建（加载→分块→嵌入→存储） | 按需 |
| `@rag-sdk/adapters` | LangChain、Chroma 等外部服务适配 | 按需 |
| `@rag-sdk/observability` | 钩子、追踪、指标 | 按需 |
| `@rag-sdk/eval` | 评估框架 | 按需 |
| `@rag-sdk/utils` | 日志、配置工具 | 按需 |

## 推荐阅读顺序

1. **本文档** — 快速上手，理解整体数据流
2. [索引阶段](./indexing.md) — 深入 Loader、Chunker、Embedder、VectorStore，接入真实外部服务
3. [运行时阶段](./runtime.md) — 深入四阶段管线、Postprocessor 策略链、调试能力
4. [扩展指南](./adapters.md) — 自定义适配器，接入你自己的外部服务

## 下一步

- 想接入真实的嵌入模型和向量数据库？看 [索引阶段](./indexing.md)
- 想自定义检索后处理策略？看 [运行时阶段](./runtime.md)
- 想接入 OpenAI、Pinecone 等外部服务？看 [扩展指南](./adapters.md)
