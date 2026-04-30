# ADR-003: adapters 包结构与第三方抽象策略

## 状态

已采纳（2026-04-24，2026-04-30 更新）

## 背景

adapters 包负责将外部生态（LangChain、Chroma 等）的能力转换为 SDK 内部契约。

## 决策

### 1. 按外部生态组织目录

```
packages/adapters/src/
  shared/           跨生态通用收敛
  langchain/        LangChain 适配线
  chroma/           Chroma 适配线
```

### 2. 结构类型抽象第三方接口

不引入第三方运行时依赖。所有第三方接口通过内部定义的结构类型抽象：

| 内部接口 | 抽象的第三方能力 |
|----------|------------------|
| `LcDocumentLike` | LangChain Document |
| `SplitterLike` | LangChain TextSplitter |
| `EmbeddingsLike` | LangChain Embeddings |
| `ChromaClientLike` | ChromaClient |

### 3. MetadataValue 类型处理

adapters 内部定义等价的 TS 类型，避免引入 zod 作为运行时依赖。

### 4. 内置 splitter 实现

`RecursiveChunker` / `MarkdownChunker` 等预设使用内置文本分割逻辑，不依赖 `@langchain/textsplitters`。

## 更新记录（2026-04-30）

- 删除了 `__runtimeRetriever` / `__runtimeGenerator` 品牌字段
- `createRuntime` 现在严格要求 `RuntimeRetriever` / `RuntimeGenerator`
- `createDefaultRuntime` 吸收了 core→runtime 的包装逻辑
- `CoreRetrieverWrapper` / `CoreGeneratorWrapper` 成为公共 API

## 后果

- adapters 包零第三方运行时依赖
- 新增 provider 时在 `src/` 下新建生态目录即可
- 结构类型抽象意味着不享受第三方包的类型检查
