# 索引阶段

> 如果你还没跑通快速上手，先看 [SDK 使用者指南](./sdk-user.md)。

索引阶段负责将原始文档加载、切分、嵌入并写入向量存储。这是 RAG 应用的数据准备环节。

## 数据流

```
Document → Chunker → Chunk[] → Embedder → Vector[] → VectorStore
  (加载)     (切分)              (嵌入)                (存储)
```

## 核心接口

```ts
// 加载器：从外部源读取文档
interface Loader {
  load(): Promise<Document[]>
}

// 切分器：将文档切分为片段
interface Chunker {
  chunk(doc: Document): Promise<Chunk[]>
}

// 嵌入器：将片段转为向量
interface Embedder {
  embed(chunks: Chunk[]): Promise<Vector[]>
}

// 向量存储：持久化向量
interface VectorStore {
  upsert(vectors: Vector[]): Promise<void>
}

// 文档转换器（可选）：预处理文档
interface DocumentTransformer {
  transform(doc: Document): Promise<Document>
}
```

## 内置组件

| 组件 | 类 | 说明 |
|------|---|------|
| Markdown 加载器 | `MarkdownLoader` | 从目录加载 `.md` 文件 |
| 简单切分器 | `SimpleChunker` | 按大小切分，默认 500 字符，50 字符重叠 |
| Mock 嵌入器 | `MockEmbedder` | 生成随机向量，用于测试 |
| 内存向量存储 | `MemoryVectorStore` | 内存存储，支持余弦相似度检索 |

### 默认参数

```ts
import {
  DEFAULT_CHUNK_SIZE,    // 500
  DEFAULT_OVERLAP,       // 50
  DEFAULT_BATCH_SIZE,    // 10
  DEFAULT_VECTOR_DIMENSION, // 128
} from "@rag-sdk/indexing"
```

## Pipeline API

索引管线基于 `AsyncIterable` 流式架构，通过 `PipelineSteps` 构建：

```ts
import { PipelineSteps, SimpleChunker, MockEmbedder, MemoryVectorStore } from "@rag-sdk/indexing"

const store = new MemoryVectorStore()

const result = await PipelineSteps.fromLoader(myLoader)
  .pipe(PipelineSteps.chunk(new SimpleChunker()))
  .pipe(PipelineSteps.embed(new MockEmbedder()))
  .pipe(PipelineSteps.store(store))
  .consume()
```

### 可用的 Pipeline 步骤

| 步骤 | 用途 |
|------|------|
| `PipelineSteps.fromLoader(loader)` | 起点，产出 Document 流 |
| `PipelineSteps.filter(predicate)` | 过滤文档 |
| `PipelineSteps.transform(transformer)` | 转换文档（清洗、过滤等） |
| `PipelineSteps.chunk(chunker)` | 切分文档为 Chunk[] |
| `PipelineSteps.metadata(builder)` | 为 Chunk 添加元数据 |
| `PipelineSteps.embed(embedder)` | 将 Chunk 转为 Vector |
| `PipelineSteps.store(vectorStore)` | 写入向量存储 |

### 过滤和转换

```ts
// 只索引特定文档
const result = await PipelineSteps.fromLoader(loader)
  .pipe(PipelineSteps.filter((doc) => doc.content.length > 100))
  .pipe(PipelineSteps.transform(myTransformer))
  .pipe(PipelineSteps.chunk(chunker))
  .pipe(PipelineSteps.embed(embedder))
  .pipe(PipelineSteps.store(store))
  .consume()

// 添加自定义元数据
const result = await PipelineSteps.fromLoader(loader)
  .pipe(PipelineSteps.chunk(chunker))
  .pipe(PipelineSteps.metadata((doc, chunk, ctx) => ({
    source: doc.id,
    chunkIndex: ctx.documentIndex,
    timestamp: Date.now(),
  })))
  .pipe(PipelineSteps.embed(embedder))
  .pipe(PipelineSteps.store(store))
  .consume()
```

### 返回值

`consume()` 返回 `IndexingResult`：

```ts
interface IndexingResult {
  totalDocuments: number  // 处理的文档数
  totalChunks: number     // 生成的 Chunk 数
  errors: Error[]         // 管线中的错误
}
```

## 自定义组件

### 自定义 Loader

```ts
import type { Loader } from "@rag-sdk/indexing"
import type { Document } from "@rag-sdk/core"

class DatabaseLoader implements Loader {
  async load(): Promise<Document[]> {
    const rows = await db.query("SELECT id, content FROM documents")
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: { source: "database" },
    }))
  }
}
```

### 自定义 Chunker

```ts
import type { Chunker } from "@rag-sdk/indexing"
import type { Document, Chunk } from "@rag-sdk/core"

class ParagraphChunker implements Chunker {
  async chunk(doc: Document): Promise<Chunk[]> {
    return doc.content.split("\n\n").map((paragraph, i) => ({
      id: `${doc.id}-p${i}`,
      content: paragraph.trim(),
      metadata: { ...doc.metadata, paragraphIndex: i },
    }))
  }
}
```

## 接入真实外部服务

### 使用 LangChain 嵌入模型

```ts
import { PipelineSteps, SimpleChunker, MemoryVectorStore } from "@rag-sdk/indexing"
import { langchain } from "@rag-sdk/adapters"
import { OpenAIEmbeddings } from "@langchain/openai"

const embedder = new langchain.embedders.LangChainEmbedderAdapter({
  embeddings: new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
})

const result = await PipelineSteps.fromLoader(myLoader)
  .pipe(PipelineSteps.chunk(new SimpleChunker()))
  .pipe(PipelineSteps.embed(embedder))
  .pipe(PipelineSteps.store(new MemoryVectorStore()))
  .consume()
```

### 使用 LangChain 切分器

```ts
import { langchain } from "@rag-sdk/adapters"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

const chunker = new langchain.chunkers.LangChainChunkerAdapter({
  splitter: new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 }),
})
```

### 使用 LangChain 加载器

```ts
import { langchain } from "@rag-sdk/adapters"

// 从目录加载 Markdown 文件
const loader = new langchain.loaders.MarkdownDirectoryLoader("./docs")

// 或包装任意 LangChain 加载器
const loader = new langchain.loaders.LangChainLoaderAdapter({
  lcLoader: myLangChainLoader,
})
```

### 使用 ChromaDB 向量存储

```ts
import { chroma } from "@rag-sdk/adapters"
import { ChromaClient } from "chromadb"

const client = new ChromaClient()
const store = new chroma.stores.ChromaVectorStore({
  client,
  collectionName: "my-collection",
})

await PipelineSteps.fromLoader(myLoader)
  .pipe(PipelineSteps.chunk(myChunker))
  .pipe(PipelineSteps.embed(myEmbedder))
  .pipe(PipelineSteps.store(store))
  .consume()
```

## 错误处理

```ts
import { IndexingError } from "@rag-sdk/indexing"

try {
  const result = await pipeline.consume()
  if (result.errors.length > 0) {
    console.warn("Pipeline completed with errors:", result.errors)
  }
} catch (err) {
  if (err instanceof IndexingError) {
    console.error("Indexing failed:", err.message)
  }
}
```

## 下一步

索引完成后，进入 [运行时阶段](./runtime.md) 进行查询和生成。
