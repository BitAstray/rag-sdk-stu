# Indexing 包

离线索引构建管线。将原始文档加工为可检索的向量索引。

## 职责

- 实现 5 阶段离线管线：load → transform → chunk → embed → store
- 定义 Loader、DocumentTransformer、Chunker、Embedder、VectorStore 接口
- 提供内置组件：SimpleChunker、MockEmbedder、MemoryVectorStore、MarkdownLoader
- 支持每阶段错误隔离和回调

## 目录结构

```
src/
  types/          接口定义和管线类型
    index.ts      Loader、Chunker、Embedder、VectorStore、DocumentTransformer
                  IndexingOptions、IndexingResult、IndexingContext
    errors.ts     IndexingError
  chunkers/       分块器
    simple-chunker.ts   SimpleChunker（滑动窗口分块）
    index.ts
  loaders/        加载器
    markdown-loader.ts  MarkdownLoader（从目录加载 .md 文件，支持 FileSystem 注入）
    index.ts
  stores/         向量存储
    memory-vector-store.ts  MemoryVectorStore（内存存储）
    index.ts
  embedders/      嵌入器
    mock-embedder.ts    MockEmbedder（确定性测试用嵌入）
    types.ts            Embedder 接口 + Vector 再导出
    index.ts
  transformers/   文档转换器
    index.ts
  pipeline/       管线执行
    run-indexing.ts     runIndexing() 编排器
  defaults/       默认常量
    index.ts      DEFAULT_CHUNK_SIZE、DEFAULT_OVERLAP 等
  index.ts        公共 API 导出
__tests__/        单元测试
```

## 管线流程

```mermaid
graph LR
    D[文档源] --> L[Loader]
    L -->|Document[]| T[Transformer]
    T -->|Document[]| C[Chunker]
    C -->|Chunk[]| E[Embedder]
    E -->|Vector[]| S[VectorStore]
```
