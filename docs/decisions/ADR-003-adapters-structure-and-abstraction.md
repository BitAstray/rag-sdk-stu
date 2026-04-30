# ADR-003: adapters 包结构与第三方抽象策略

## 状态

已采纳（2026-04-24）

## 背景

adapters 包负责将外部生态（LangChain、Chroma 等）的能力转换为 SDK 内部统一契约（Loader / Chunker / Embedder / VectorStore）。需要决定：

1. 目录结构按什么维度组织
2. 如何处理与第三方 SDK 的类型依赖
3. 共享收敛逻辑放在哪一层

## 决策

### 1. 按外部生态组织目录，再按内部角色拆分

```
packages/adapters/src/
  shared/           # 跨生态通用收敛
  langchain/        # LangChain 适配线
    shared/         # LC 专属映射
    loaders/
    chunkers/
    embedders/
  chroma/           # Chroma 适配线
    shared/
    stores/
```

**原因：** 先回答"在适配谁"，再回答"落到哪个契约"。新增 provider 时不打乱现有结构。

### 2. 使用结构类型抽象第三方接口，不引入第三方运行时依赖

adapters 的 `package.json` 不声明 `@langchain/core`、`chromadb` 等第三方依赖。所有第三方接口通过内部定义的结构类型（structural type）抽象：

| 内部接口 | 抽象的第三方能力 |
|----------|------------------|
| `LcDocumentLike` | LangChain Document |
| `SplitterLike` | LangChain TextSplitter |
| `EmbeddingsLike` | LangChain Embeddings |
| `ChromaClientLike` | ChromaClient |
| `ChromaCollectionLike` | Chroma Collection |

**原因：**
- 避免将 SDK 与特定第三方版本绑定
- 业务方传入符合结构的实例即可，无需安装 SDK 指定版本
- 测试无需 mock 第三方包，直接构造符合结构的对象

### 3. 全局 shared 只放跨生态通用收敛逻辑

- `normalizeMetadataValue` — 任意 JS 值 → `MetadataValue`
- `normalizeMetadata` — 批量归一化
- `mergeMetadata` — 浅合并

**约束：**
- 生态专属映射（如 LC 文档互转）放在该生态的 `shared/` 下
- 只服务单个 adapter 的逻辑保留在该实现内部

### 4. MetadataValue 类型处理

core 的 `MetadataValue` 是 Zod const（运行时值），不是 TypeScript type。adapters 内部定义等价的 TS 类型：

```ts
export type MetadataValueT = string | number | boolean | null | string[]
```

**原因：** 避免引入 zod 作为 adapters 的运行时依赖。此类型与 core 的 Zod schema 推断结果完全等价。

### 5. 内置 splitter 实现

`RecursiveChunker` / `MarkdownChunker` 等预设使用内置的文本分割逻辑，不依赖 `@langchain/textsplitters`。

**原因：** 减少外部依赖。预设是便利设施，业务方可以传入任何符合 `SplitterLike` 的实例。

## 后果

- adapters 包零第三方运行时依赖，仅依赖 `@rag-sdk/core` 和 `@rag-sdk/indexing`
- 新增 provider（如 Pinecone、OpenAI）时，在 `src/` 下新建生态目录即可
- 结构类型抽象意味着不享受第三方包的类型检查，需要靠 adapter 内部的转换逻辑保证正确性
- 内置 splitter 功能有限，复杂场景（如 token 精确切分）需要业务方自行传入第三方 splitter
