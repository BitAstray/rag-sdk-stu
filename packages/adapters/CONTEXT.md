# Adapters

外部服务的适配器实现。实现 Core 的用户接口和 Indexing 的索引接口，对接具体的 LLM、嵌入模型、向量存储等外部服务。

## Language

**Adapter**:
将外部服务的具体 API 包装为 SDK 内部接口的实现。
_Avoid_: client, wrapper

## Relationships

- **Adapters** 实现 **Core** 中的用户接口：Retriever、Generator
- **Adapters** 实现 **Indexing** 中的索引接口：VectorStore、Embedder、Chunker、Loader
- 每个 Adapter 对接一个具体的外部服务（如 OpenAI Embedding、Pinecone、ChromaDB 等）
- **Adapters** 不直接实现 **Runtime** 的运行时内部接口（RuntimeRetriever, RuntimeGenerator），这些接口由 Runtime 的 Wrapper 模式桥接

## Interface Layering

**Adapters 实现的是"用户层"接口**，而不是"运行时层"接口：

- **Core 的用户接口**：Retriever、Generator — 用户实现这些简单接口，Runtime 通过 Wrapper 自动包装
- **Indexing 的索引接口**：VectorStore、Embedder、Chunker、Loader — 索引流程使用这些接口

**为什么 Adapters 不实现 Runtime 的接口？**
- Runtime 的接口（RuntimeRetriever, RuntimeGenerator）是运行时内部接口，支持更细粒度的控制
- 用户只需要实现 Core 的简单接口，Runtime 通过 Wrapper 模式自动桥接
- 这种分层使得 Adapters 的实现更简单，用户学习成本更低

## Example dialogue

> **Dev:** "我写了一个 OpenAI **Adapter** 来实现 **Embedder** 接口，调用 `text-embedding-3-small` 模型。"
> **Domain expert:** "好，这样用户可以通过替换 **Adapter** 来切换嵌入模型，不需要改动 **Indexing Pipeline**。"

> **Dev:** "我写了一个 OpenAI **Adapter** 来实现 **Retriever** 接口。"
> **Domain expert:** "好，这样用户可以通过替换 **Adapter** 来切换检索实现，Runtime 会通过 **CoreRetrieverWrapper** 自动包装为 **RuntimeRetriever**。"
