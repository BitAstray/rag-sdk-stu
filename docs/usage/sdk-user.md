# SDK 使用者指南

## 安装

```bash
# 核心类型（必须）
pnpm add @rag-sdk/core

# 运行时管线
pnpm add @rag-sdk/runtime

# 索引管线
pnpm add @rag-sdk/indexing

# 外部服务适配器
pnpm add @rag-sdk/adapters
```

## 快速上手

### 最简 RAG 流程

```ts
import { createDefaultRuntime } from "@rag-sdk/runtime"
import type { Retriever, Generator } from "@rag-sdk/core"

const retriever: Retriever = {
  async retrieve(query) {
    // 从向量存储中检索相关 chunks
    return [{ id: "1", content: "相关内容" }]
  },
}

const generator: Generator = {
  async generate({ query, chunks }) {
    // 基于 chunks 生成回答
    return `基于 ${chunks.length} 个片段的回答`
  },
}

const runtime = createDefaultRuntime({ retriever, generator })
const result = await runtime.run({ query: "什么是 RAG?" })
console.log(result.answer)
```

### 索引数据

```ts
import { runIndexing, SimpleChunker, MockEmbedder, MemoryVectorStore } from "@rag-sdk/indexing"

const result = await runIndexing({
  loader: { load: async () => [{ id: "doc-1", content: "文档内容" }] },
  chunker: new SimpleChunker(),
  embedder: new MockEmbedder(),
  store: new MemoryVectorStore(),
})
```

### 完全控制 Runtime

```ts
import { createRuntime } from "@rag-sdk/runtime"

const runtime = createRuntime({
  retriever: myRuntimeRetriever,   // RuntimeRetriever 接口
  generator: myRuntimeGenerator,   // RuntimeGenerator 接口
  preprocessor: myPreprocessor,    // 可选：query 改写
  postprocessor: myPostprocessor,  // 可选：结果过滤
})
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

## API 速查

### @rag-sdk/core

- **类型**: `Query`, `Chunk`, `Document`, `Vector`, `RAGResponse`
- **Schema**: `QuerySchema`, `ChunkSchema`, `DocumentSchema`, `VectorSchema`, `RAGResponseSchema`
- **接口**: `Retriever`, `Generator`
- **错误**: `RagError`, `ValidationError`, `RetrievalError`, `GenerationError`, `createRagError`

### @rag-sdk/runtime

- **入口**: `createRuntime`, `createDefaultRuntime`
- **接口**: `RuntimeRetriever`, `RuntimeGenerator`, `QueryPreprocessor`, `RetrievalPostprocessor`
- **适配器**: `CoreRetrieverWrapper`, `CoreGeneratorWrapper`
- **默认**: `NoopQueryPreprocessor`, `PassthroughRetrievalPostprocessor`

### @rag-sdk/indexing

- **入口**: `runIndexing`
- **接口**: `Loader`, `Chunker`, `Embedder`, `VectorStore`, `DocumentTransformer`
- **默认组件**: `SimpleChunker`, `MockEmbedder`, `MemoryVectorStore`, `MarkdownLoader`
- **工具**: `FileSystem`
