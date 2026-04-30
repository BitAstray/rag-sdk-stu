# Adapters

外部服务的适配器实现。实现 Indexing 和 Runtime 定义的接口，对接具体的 LLM、嵌入模型、向量存储等外部服务。

## Language

**Adapter**:
将外部服务的具体 API 包装为 SDK 内部接口的实现。
_Avoid_: client, wrapper

## Relationships

- **Adapters** 实现 **Indexing** 中的接口：VectorStore、Embedder、Chunker、Loader
- **Adapters** 实现 **Runtime** 中的接口：Retriever、Generator、Reranker
- 每个 Adapter 对接一个具体的外部服务（如 OpenAI Embedding、Pinecone、ChromaDB 等）

## Example dialogue

> **Dev:** "我写了一个 OpenAI **Adapter** 来实现 **Embedder** 接口，调用 `text-embedding-3-small` 模型。"
> **Domain expert:** "好，这样用户可以通过替换 **Adapter** 来切换嵌入模型，不需要改动 **Indexing Pipeline**。"
