# Runtime 包

在线 RAG 查询编排层。将原始查询转化为结构化回答。

## 职责

- 实现 4 阶段在线管线：pre-retrieval → retrieval → post-retrieval → generation
- 提供 QueryPreprocessor、RuntimeRetriever、RetrievalPostprocessor、RuntimeGenerator 接口
- 支持 core 基础接口（Retriever/Generator）的自动适配
- 记录各阶段耗时和调试信息

## 目录结构

```
src/
  spec/           Zod Schema + TS 类型
    preprocessed-query.ts   PreprocessedQuery（改写后的查询）
    retrieval-candidate.ts  RetrievalCandidate
    selection-trace.ts      SelectionTraceItem
    stage-result.ts         各阶段结果 Schema
    debug.ts                DebugData（开放调试数据袋）
  interfaces/     四阶段抽象接口
    query-preprocessor.ts       QueryPreprocessor
    runtime-retriever.ts        RuntimeRetriever + RuntimeRetrieverResult
    retrieval-postprocessor.ts  RetrievalPostprocessor + RetrievalPostprocessorResult
    runtime-generator.ts        RuntimeGenerator + RuntimeGeneratorResult
  pipeline/       管线执行
    dag.ts              有向无环图执行引擎（executeDAG + ExecutionContext + DAGExecutionResult）
    create-runtime.ts   createRuntime() 工厂
  observer/       发射器封装
    emit.ts             createRuntimeEmitter（绑定 scope=runtime，复用 observability 的 createEmitter）
  defaults/       默认实现
    create-default-runtime.ts   createDefaultRuntime() 便捷入口
    retriever-wrapper.ts        CoreRetrieverWrapper（core→runtime 适配）
    generator-wrapper.ts        CoreGeneratorWrapper（core→runtime 适配）
    noop-query-preprocessor.ts  空预处理器
    passthrough-postprocessor.ts 直通后处理器
    postprocessor/              策略组合中间件
      pipeline.ts
      strategies.ts
      context-ordering.ts
  errors/         RuntimeError + RuntimeStage
__tests__/        单元测试
```

## 管线流程 (DAG)

基于 `executeDAG(nodes, initialInputs, context)` 解析节点依赖并发执行。observer/trace 通过显式的 `ExecutionContext`（第三参数）传入，不混入节点数据。`run()` 返回 `DAGExecutionResult`（`outputs[nodeId] = { value, durationMs }`）：

```mermaid
graph LR
    Q[Query] --> P[Preprocessor Node]
    P -->|PreprocessedQuery| R[Retriever Node]
    R -->|Chunk[]| PP[Postprocessor Node]
    P -->|PreprocessedQuery| PP
    PP -->|Chunk[] + promptContext| G[Generator Node]
    P -->|PreprocessedQuery| G
    G -->|answer| RES[DAGExecutionResult.outputs.generator]
```
