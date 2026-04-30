# Context Map

RAG SDK monorepo，7 个包各有独立的领域上下文。本文档面向 AI，人类文档见 `docs/`。

## Contexts

- [Core](./packages/core/CONTEXT.md) — 共享数据类型和管线抽象
- [Runtime](./packages/runtime/CONTEXT.md) — 检索、重排、生成、上下文管理
- [Indexing](./packages/indexing/CONTEXT.md) — 加载、分块、嵌入、向量存储
- [Adapters](./packages/adapters/CONTEXT.md) — 外部服务适配器实现
- [Observability](./packages/observability/CONTEXT.md) — 钩子、追踪、指标
- [Eval](./packages/eval/CONTEXT.md) — 数据集、运行器、指标、评判器
- [Utils](./packages/utils/CONTEXT.md) — 日志、配置、辅助函数

## Relationships

- **Core → (所有包)**: Core 定义共享类型（Document, Chunk, Vector, Query, RAGResponse），其他包依赖这些类型
- **Indexing → Core**: 使用 Core 的数据类型，定义索引阶段接口（VectorStore, Embedder, Chunker, Loader）
- **Runtime → Core**: 使用 Core 的数据类型，定义运行时接口（Retriever, Generator, Reranker）
- **Adapters → Indexing + Runtime**: 实现 Indexing 和 Runtime 定义的接口
- **Observability → Core**: 仅依赖 Core 的类型，作为横切关注点被其他包引用
- **Eval → Runtime**: 依赖 Runtime 的管线执行能力进行评估
- **Utils → (所有包)**: 提供通用工具，被所有包引用
