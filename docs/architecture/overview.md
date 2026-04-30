# 架构总览

RAG SDK 是一个 TypeScript pnpm monorepo，包含 7 个包分组。

## 包拓扑

```mermaid
graph TD
    Utils[utils<br/>日志、配置]
    Core[core<br/>类型、接口、错误]
    Runtime[runtime<br/>在线编排]
    Indexing[indexing<br/>离线索引]
    Adapters[adapters<br/>外部适配器]
    Observability[observability<br/>钩子、追踪、指标]
    Eval[eval<br/>评估框架]

    Core --> Utils
    Runtime --> Core
    Indexing --> Core
    Indexing --> Adapters
    Indexing --> Utils
    Adapters --> Core
    Adapters --> Indexing
    Observability --> Core
    Eval --> Runtime
    Eval --> Core
    Eval --> Utils
```

## 依赖关系

| 包 | 依赖 | 职责 |
|---|---|---|
| `utils` | 无 | 日志、配置、辅助函数 |
| `core` | utils | 共享数据类型（Document, Chunk, Vector, Query）、Zod Schema、接口定义、错误类型 |
| `runtime` | core | 在线查询编排：pre-retrieval → retrieval → post-retrieval → generation |
| `indexing` | core, adapters, utils | 离线索引构建：load → transform → chunk → embed → store |
| `adapters` | core, indexing | 外部服务适配器（LangChain、Chroma 等） |
| `observability` | core | 横切关注点：钩子、追踪、指标 |
| `eval` | runtime, core, utils | 评估框架：数据集、运行器、评判器、指标 |

## 核心数据流

```mermaid
graph LR
    subgraph 离线索引
        D[Document] --> L[Loader]
        L --> T[Transformer]
        T --> C[Chunker]
        C --> E[Embedder]
        E --> V[VectorStore]
    end

    subgraph 在线查询
        Q[Query] --> P[Preprocessor]
        P --> R[Retriever]
        R --> PP[Postprocessor]
        PP --> G[Generator]
        G --> A[RAGResponse]
    end
```
