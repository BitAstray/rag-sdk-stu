# 扩展指南

> 如果你还没跑通快速上手，先看 [SDK 使用者指南](./sdk-user.md)。

Adapters 让你接入自己的外部服务（LLM、嵌入模型、向量存储等），无需改动 SDK 内部代码。

## 已有适配器

### @rag-sdk/adapters/langchain

将 LangChain 组件包装为 SDK 接口：

| 适配器 | 实现接口 | 用途 |
|--------|---------|------|
| `LangChainLoaderAdapter` | `Loader` | 包装任意 LangChain 加载器 |
| `MarkdownDirectoryLoader` | `Loader` | 从目录加载 Markdown 文件 |
| `LangChainChunkerAdapter` | `Chunker` | 包装 LangChain 文本分割器 |
| `LangChainEmbedderAdapter` | `Embedder` | 包装 LangChain 嵌入模型 |

```ts
import { langchain } from "@rag-sdk/adapters"

// 加载器
const loader = new langchain.loaders.MarkdownDirectoryLoader("./docs")
const loader = new langchain.loaders.LangChainLoaderAdapter({ lcLoader: myLcLoader })

// 切分器
const chunker = new langchain.chunkers.LangChainChunkerAdapter({ splitter: mySplitter })

// 嵌入器
const embedder = new langchain.embedders.LangChainEmbedderAdapter({ embeddings: myEmbeddings })
```

### @rag-sdk/adapters/chroma

| 适配器 | 实现接口 | 用途 |
|--------|---------|------|
| `ChromaVectorStore` | `VectorStore` | ChromaDB 向量存储 |

```ts
import { chroma } from "@rag-sdk/adapters"
import { ChromaClient } from "chromadb"

const store = new chroma.stores.ChromaVectorStore({
  client: new ChromaClient(),
  collectionName: "my-collection",
})
```

### @rag-sdk/adapters/shared

元数据归一化工具，写自定义适配器时使用：

```ts
import { shared } from "@rag-sdk/adapters"

shared.normalizeMetadataValue(value)  // 归一化单个值
shared.normalizeMetadata(record)      // 归一化整个元数据对象
shared.mergeMetadata(target, source)  // 合并元数据
```

## 自定义适配器

### 实现 Embedder

以接入 OpenAI 嵌入模型为例：

```ts
import type { Embedder } from "@rag-sdk/indexing"
import type { Chunk, Vector } from "@rag-sdk/core"

class OpenAIEmbedder implements Embedder {
  constructor(
    private apiKey: string,
    private model = "text-embedding-3-small",
  ) {}

  async embed(chunks: Chunk[]): Promise<Vector[]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: chunks.map((c) => c.content),
      }),
    })

    const data = await response.json()
    return chunks.map((chunk, i) => ({
      id: chunk.id,
      values: data.data[i].embedding,
      metadata: chunk.metadata,
    }))
  }
}
```

使用：

```ts
import { PipelineSteps, SimpleChunker, MemoryVectorStore } from "@rag-sdk/indexing"

const embedder = new OpenAIEmbedder(process.env.OPENAI_API_KEY!)

await PipelineSteps.fromLoader(myLoader)
  .pipe(PipelineSteps.chunk(new SimpleChunker()))
  .pipe(PipelineSteps.embed(embedder))
  .pipe(PipelineSteps.store(new MemoryVectorStore()))
  .consume()
```

### 实现 VectorStore

以接入 Pinecone 为例：

```ts
import type { VectorStore } from "@rag-sdk/indexing"
import type { Vector } from "@rag-sdk/core"

class PineconeVectorStore implements VectorStore {
  constructor(
    private index: PineconeIndex,
    private namespace = "default",
  ) {}

  async upsert(vectors: Vector[]): Promise<void> {
    await this.index.namespace(this.namespace).upsert(
      vectors.map((v) => ({
        id: v.id,
        values: v.values,
        metadata: v.metadata ?? {},
      }))
    )
  }
}
```

### 实现 Loader

```ts
import type { Loader } from "@rag-sdk/indexing"
import type { Document } from "@rag-sdk/core"

class DatabaseLoader implements Loader {
  constructor(private db: Database) {}

  async load(): Promise<Document[]> {
    const rows = await this.db.query("SELECT id, content, metadata FROM documents")
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
    }))
  }
}
```

### 实现 Chunker

```ts
import type { Chunker } from "@rag-sdk/indexing"
import type { Document, Chunk } from "@rag-sdk/core"

class SentenceChunker implements Chunker {
  async chunk(doc: Document): Promise<Chunk[]> {
    const sentences = doc.content.match(/[^.!?]+[.!?]+/g) ?? [doc.content]
    return sentences.map((sentence, i) => ({
      id: `${doc.id}-s${i}`,
      content: sentence.trim(),
      metadata: { ...doc.metadata, sentenceIndex: i },
    }))
  }
}
```

## 接口契约

实现适配器时必须满足的约束：

### Loader

- `load()` 返回 `Document[]`，每个 Document 必须有 `id` 和 `content`
- 失败时抛出异常，不要返回空数组静默失败

### Chunker

- `chunk(doc)` 返回 `Chunk[]`，每个 Chunk 必须有 `id` 和 `content`
- Chunk 的 `id` 应该包含源 Document 的 `id`，便于溯源
- 返回空数组表示文档无法切分（如空文档），不是错误

### Embedder

- `embed(chunks)` 返回 `Vector[]`，长度必须等于输入的 `chunks.length`
- 每个 Vector 的 `values` 长度必须一致（维度一致性）
- 空输入返回空数组

### VectorStore

- `upsert(vectors)` 是幂等的——相同 `id` 的向量应被覆盖
- 空输入应直接返回，不要抛出异常
- 向量维度不一致时应抛出明确的错误信息

## 适配器与管线对接

### 传给索引管线

```ts
import { PipelineSteps } from "@rag-sdk/indexing"

// 自定义 Embedder
const embedder = new MyEmbedder()
await PipelineSteps.fromLoader(myLoader)
  .pipe(PipelineSteps.chunk(myChunker))
  .pipe(PipelineSteps.embed(embedder))  // 直接传入
  .pipe(PipelineSteps.store(myStore))
  .consume()
```

### 传给 Runtime

```ts
import { createDefaultRuntime } from "@rag-sdk/runtime"

const runtime = createDefaultRuntime({
  retriever: {
    async retrieve(query) {
      // 用自定义 VectorStore 检索
      return myStore.search(query.query, { topK: 5 })
    },
  },
  generator: {
    async generate({ query, chunks }) {
      // 用自定义 LLM 生成
      return myLLM.generate(query.query, chunks)
    },
  },
})
```

### 用 createRuntime 完全控制

```ts
import { createRuntime } from "@rag-sdk/runtime"

const runtime = createRuntime({
  nodes: [
    {
      id: "preprocessor",
      dependencies: ["query"],
      execute: async (inputs) => myPreprocessor.preprocess(inputs.query),
    },
    {
      id: "retriever",
      dependencies: ["preprocessor"],
      execute: async (inputs) => myRetriever.retrieve(inputs.preprocessor),
    },
    {
      id: "postprocessor",
      dependencies: ["preprocessor", "retriever"],
      execute: async (inputs) => myPostprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates),
    },
    {
      id: "generator",
      dependencies: ["preprocessor", "postprocessor"],
      execute: async (inputs) => myGenerator.generate(inputs.preprocessor, inputs.postprocessor.candidates, inputs.postprocessor.promptContext),
    },
  ],
})
```

## 下一步

- 想了解索引阶段的更多细节？看 [索引阶段](./indexing.md)
- 想了解运行时阶段的更多细节？看 [运行时阶段](./runtime.md)
