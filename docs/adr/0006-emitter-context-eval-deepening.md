# ADR-006: 架构深化重构（发射器收敛、类型化执行上下文、幽灵类型清理、Eval 落地）

## 状态

已采纳（2026-06-04）

## 背景

在 ADR-004、ADR-005 两轮深化之后，仍存在多处架构摩擦：

1. **发射逻辑双份复制**：`runtime/observer/emit.ts` 与 `indexing/observer/emit.ts` 导出同名同接口的 `emitEvent`/`emitError`/`createEmitContext`，实现几乎逐行复制，且已出现行为漂移（runtime 的 `emitError` 不带 dataset/version/tags，indexing 带）。
2. **observability/utils 纯透传**：`utils/{id,safe-json,timestamp}.ts` 的全部内容是 `export ... from "@rag-sdk/utils"`，是 ADR-004 已清理的透传反模式的残留实例。
3. **DAG 魔法键**：observer/trace 通过 `_observer`/`_traceId` 等未类型化的 `_` 前缀键塞进 `executeDAG` 的数据输入，拼错即静默丢失观测。
4. **幽灵结果类型**：`RuntimeContext`、`RuntimeResult` 及 `RuntimeMetadata` 描述的是 ADR-005 前的「单体 Context 按序传递」模型，DAG 化后永不被构造，但仍作为公共 API 暴露，与真实返回的 `DAGExecutionResult` 脱节。三个 `*DebugData` 类型结构完全相同。
5. **chroma metadata 重复收窄**：`toChromaMetadata` 重抄了 `normalizeMetadataValue` 已完成的类型收窄，末尾 `else` 分支在已收窄输入上不可达（死代码）。
6. **trace 形状三处重复**：`{ traceId, dataset, version, tags }` 在 `IndexingOptions`、`fromLoader`、`createEmitContext` 三处匿名重复定义。
7. **eval 空壳**：CONTEXT 宣称「运行器、指标、评判器」，实际只有类型声明，违反「禁止缺失 Demo 或测试」。

## 决策

### 1. 发射协议收敛到 Observability

在 `observability` 新增 `createEmitter({ scope, traceId, observer, baseAttributes })`，返回带 `event()`/`error()` 方法的 `Emitter`。这是发射协议的唯一实现点：`RAGEvent`/`RAGErrorRecord` 组装、observer 可选守卫、时间戳、baseAttributes 合并全部集中于此。

runtime/indexing 各自保留一个薄封装：`createRuntimeEmitter`（绑定 `scope="runtime"`）、`createIndexingEmitter`（绑定 `scope="indexing"` 并把 dataset/version/tags 作为 baseAttributes）。

**原因：** 发射协议本属于 observability（它拥有 RAGEvent/RAGObserver）。收敛后协议变更只改一处，并顺带修复了 emitError 的行为漂移（现在两个 scope 行为一致）。

### 2. 删除 observability/utils 透传外壳

删除 `utils/{id,safe-json,timestamp}.ts` 与 `utils/index.ts`，调用方直接从 `@rag-sdk/utils` 导入。保留有实质内容的 `validate-event-name.ts`。

### 3. DAG 引擎类型化执行上下文

`executeDAG(nodes, initialInputs, context: ExecutionContext)` 新增第三个显式参数承载 observer/requestId/traceId/traceTags。删除 `_` 魔法键与 `delete` 清扫逻辑。

**原因：** 横切关注点（观测、追踪）应通过类型化 seam 传入，而非混在节点数据里靠约定偷渡。

### 4. 清理幽灵结果类型

删除 `RuntimeContext`/`RuntimeContextSchema`、`RuntimeResult`/`RuntimeResultSchema`、`RuntimeMetadata`。三个 `*DebugData` 收敛为单一 `DebugData`（仍被 runtime 内部接口的 `debug?` 字段使用，保留为公共类型）。`run()` 的真实输出类型 `DAGExecutionResult` 成为唯一的结果契约。

### 5. 收敛 chroma metadata

`toChromaMetadata` 改为薄封装：空输入返回 undefined，其余委托给 `normalizeMetadata`。删除重复的 narrowing 循环与死分支。

### 6. 抽取 TraceOptions

在 `indexing/types` 定义具名 `TraceOptions`，`IndexingOptions.trace`、`fromLoader` 的 `trace`、`createIndexingEmitter` 的 trace 参数统一引用。

### 7. Eval 落地

实现最小可用评估闭环：
- `metrics/`：`RecallAtK`、`ReciprocalRank`、`AnswerPresence`，按名解析（未知指标抛错）。
- `judges/`：`Judge` 接口 + 不依赖 LLM 的 `HeuristicJudge`（faithfulness/groundedness）。
- `runner/`：`Runner` 通过依赖注入的 `EvalPipeline`（`(Query) => RAGResponse`）执行评估，不直接依赖 runtime；`summarize` 产出 mean/min/max/std。
- `trace/`：`extractQualitySignals`/`extractEvalSample` 从 observability 的 `RAGTrace` 提取 eval 样本（落实 eval → observability 依赖）。
- 配套 demo 与 4 个测试文件。

## 后果

- **破坏性变更（runtime 公共 API）**：移除 `emitEvent`/`emitError`/`createEmitContext`/`EmitContext`、`RuntimeContext(Schema)`、`RuntimeResult(Schema)`、`RuntimeMetadata`、三个 `*DebugData`。新增 `createRuntimeEmitter`/`RuntimeEmitter`、`ExecutionContext`、`DebugData`。`executeDAG` 新增第三参数。
- **破坏性变更（indexing 公共 API）**：移除 `emitEvent`/`emitError`/`createEmitContext`/`EmitContext`，新增 `createIndexingEmitter`/`IndexingEmitter`/`TraceOptions`。
- **破坏性变更（observability 公共 API）**：`@rag-sdk/observability` 不再 re-export `createId`/`createTraceId`/`safeStringify`/`toSerializable`/`createTimestamp`（改从 `@rag-sdk/utils` 导入）；新增 `createEmitter`/`Emitter`。
- eval 从空壳变为可运行包，`@rag-sdk/observability` 依赖落到实处，新增 `@rag-sdk/utils` 依赖。
- 五层验证全链路通过（typecheck / unit 293+ / demo / integration 34 / smoke 18）。
