# ADR-004: 架构深化重构

## 状态

已采纳（2026-04-30）

## 背景

RAG SDK 存在多处架构摩擦：`spec/`/`types/` 目录分裂导致理解一个概念需要跳转 5+ 文件；错误类是结构相同的样板代码；runtime 管线需要 12 个文件才能理解；品牌字段泄漏实现细节；indexing 有纯透传模块；`MarkdownLoader` 直接导入 `fs` 无法测试。

## 决策

### 1. Core spec/types 合并

将每个 Zod schema 和推导的 TS 类型放在同一个文件。删除 `types/` 目录。

**原因：** 10 个文件定义 5 个类型，5 层再导出。合并后每个概念一个文件。

### 2. 错误工厂函数

添加 `createRagError(code, message, cause)` 工厂函数，保留子类向后兼容。

**原因：** 3 个子类结构完全相同，只差 code 字符串。

### 3. Runtime spec/types 合并

同 core 相同模式，删除 runtime 的 `types/` 目录。

### 4. 消除品牌字段

删除 `__runtimeRetriever` / `__runtimeGenerator` 品牌字段。`createRuntime` 严格要求 runtime 接口。`createDefaultRuntime` 吸收包装逻辑。

**原因：** 品牌字段是脆弱的运行时类型判别模式，泄漏实现细节。

### 5. Schema 去重

`PreRetrievalResultSchema` 改用 `PreprocessedQuerySchema.extend()`。

**原因：** 原来重复了 7 个字段，schema 变更会静默漂移。

### 6. Indexing 透传删除

删除 chunkers/loaders/transformers/stores 下的 `types.ts` 纯透传文件。

**原因：** `types.ts` 和 `index.ts` 包含完全相同的行。

### 7. MarkdownLoader FileSystem 注入

`MarkdownLoader` 和 `MarkdownDirectoryLoader` 接受可选 `FileSystem` 参数，默认 Node fs。

**原因：** 直接导入 `fs` 无法测试，注入后可用 mock 实现。

### 8. 类型化 RuntimeMetadata

定义 `RetrievalDebugData`、`PostRetrievalDebugData`、`GenerationDebugData`、`RuntimeMetadata` 接口。

**原因：** 原来 `metadata: Record<string, unknown>` 是无类型契约。

## 后果

- 删除 11 个文件（core/types 6 个 + runtime/types 5 个 + indexing 透传 4 个）
- 新增 2 个文件（debug.ts、factory.test.ts）
- `createRuntime` 接口收窄（破坏性变更），`createDefaultRuntime` 保持兼容
- `CoreRetrieverWrapper` / `CoreGeneratorWrapper` 成为公共 API
