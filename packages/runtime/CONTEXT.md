# Runtime

RAG Pipeline 的运行时执行层。定义检索、重排、生成阶段的接口，并提供管线执行能力。

## Language

**Retriever**:
根据 Query 从向量存储中检索相关 Chunks 的接口。
_Avoid_: searcher, finder

**Reranker**:
对检索结果进行重排序的接口，提升结果相关性。
_Avoid_: scorer, ranker

**Generator**:
基于 Chunks 和 Query 生成文本答案的接口。
_Avoid_: completer, responder

**ContextManager**:
管理上下文窗口的组件，负责 Token 预算控制和多轮对话追踪。
_Avoid_: context window, memory

## Relationships

- **RAG Pipeline** 的执行顺序：Retriever → Reranker → Generator
- **Retriever** 返回 Chunk[]，传给 **Reranker** 重排序
- **Reranker** 输出重排后的 Chunk[]，传给 **Generator**
- **Generator** 结合 Query + Chunk[] 生成 RAGResponse
- **ContextManager** 在多轮场景下维护对话历史

## Example dialogue

> **Dev:** "**Retriever** 返回了 20 个 **Chunk**，但 **Generator** 的上下文窗口只能放 5 个。"
> **Domain expert:** "所以需要 **Reranker** 先排序，再由 **ContextManager** 按 Token 预算截断。"
