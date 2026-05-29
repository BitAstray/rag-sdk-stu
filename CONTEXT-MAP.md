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

- **Core → (所有包)**: Core 定义共享类型（Document, Chunk, Vector, Query, RAGResponse）和用户实现接口（Retriever, Generator），其他包依赖这些类型
- **Indexing → Core**: 使用 Core 的数据类型，定义索引阶段接口（VectorStore, Embedder, Chunker, Loader）
- **Indexing → Observability**: 可选依赖，通过 Observer 接口实现链路观测
- **Runtime → Core**: 使用 Core 的数据类型，定义运行时内部接口（RuntimeRetriever, RuntimeGenerator），通过 Wrapper 桥接用户实现
- **Runtime → Observability**: 可选依赖，通过 Observer 接口实现链路观测
- **Adapters → Core + Indexing**: 实现 Core 的用户接口（Retriever, Generator）和 Indexing 的索引接口（VectorStore, Embedder, Chunker, Loader）
- **Observability → Core**: 依赖 Core 的 JsonValue 类型，作为 RAG 链路观测与诊断层，提供 Observer、Exporter、Redaction、Sampling 能力
- **Eval → Core + Observability**: 使用 Core 的数据类型，通过 Observability 的 trace 数据结构提取 eval 样本。Runner 可通过依赖注入调用 Runtime，但不直接依赖 Runtime 包
- **Utils**: 通用工具层，提供时间戳、ID 生成、安全 JSON 序列化等基础函数。不依赖其他 @rag-sdk 包。Observability、Runtime、Indexing 均依赖 Utils
- **Observability → Utils**: 使用 Utils 的 createTimestamp、createId、safeStringify、toSerializable
- **Runtime → Utils**: 使用 Utils 的 createTimestamp、createId
- **Indexing → Utils**: 使用 Utils 的 createTimestamp、createId
