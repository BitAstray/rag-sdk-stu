# ADR-005: 架构深化重构 (DAG、流式引擎与组合式后处理)

## 状态

已采纳（2026-05-11）

## 背景

在检查 RAG SDK 的架构摩擦时，我们发现了以下几个 "浅模块"（Shallow Module）的设计：
1. `createDefaultPostprocessor` 硬编码了阈值过滤、截断等多个固定的过滤阶段，并由自身进行调用，它无法被细粒度拆分或重新组合。
2. `runRuntime` 仅仅是一个封装了按序调用四阶段流程（Preprocessor -> Retriever -> Postprocessor -> Generator）的函数。如果遇到任何需要在不同阶段执行不同拓扑（例如增加循环调用），就会失效。
3. `runIndexing` 作为一个庞大的基于 for 循环实现的批处理，缺乏背压（Backpressure），也难以灵活在流程中间插入其他任务或是批量操作外部调用。

## 决策

### 1. DefaultPostprocessor 转变为基于策略的中间件模型
将原来的单一执行方法深化为基于 `createPostprocessorPipeline([ steps ])` 的中间件组装器。将独立的策略（如 `scoreThreshold`, `budgetTrim`, `nearDuplicateRemoval`）拆分成函数，并在 `Pipeline` 中依次流式改变 Context。

**原因：** 这大幅提升了策略扩展性和 Locality，不同阶段不再杂糅在一个函数中。

### 2. runRuntime 升级为有向无环图 (DAG) 引擎
通过 `executeDAG` 解析执行图并支持高度动态化组装的执行拓扑，`createRuntime` 会自动构建好并执行这些 DAG Nodes。

**原因：** 增加 Leverage，调用方不仅可以使用传统的 4 个阶段，而且可以自行构建更复杂的路由节点或回退节点模型，彻底解除只能运行这 4 步同步操作的耦合限制。

### 3. runIndexing 升级为流式生成与消费模型 (IndexingStream)
用 `AsyncIterable` 和中间态 `.pipe()` 替换庞大的单层 for 循环，通过流操作依次经过 Load、Transform、Chunk、Embed、Store 阶段。

**原因：** 极大提高了异步流处理上的灵活度。处理极其庞大的知识库不再受单体循环的结构限制，易于为不同管道阶段添加批处理机制 (Batching)。

## 后果

- 彻底移除了原 `createDefaultPostprocessor`、`runRuntime`、`runIndexing` 及它们配套的配置 Interface 文件，属于典型的破坏性变更 (Breaking Change)。
- 测试已全面转换以覆盖流式 Indexing 和基于 Node 的 DAG 评估模式，核心 `e2e` 集成测试证实重构不会影响 RAG SDK 整体产出数据结构的一致性。
- 代码库在测试性和 AI-导航度上大大加强，各个逻辑均分离到了明确的作用域中。
