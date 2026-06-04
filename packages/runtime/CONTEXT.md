# Runtime

RAG Pipeline 的运行时执行层。四阶段在线编排：pre-retrieval → retrieval → post-retrieval → generation。

## Language

**Preprocessor** (QueryPreprocessor):
对查询进行预处理（改写、路由、扩展等）的接口。
_Avoid_: query rewriter

**Retriever** (RuntimeRetriever):
根据 Query 从向量存储中检索相关 Chunks 的接口。返回的 candidate 携带 **RelevanceScore**。
_Avoid_: searcher, finder

**Postprocessor** (RetrievalPostprocessor):
对检索结果进行后处理的统一入口。通过 `createPostprocessorPipeline` 将一系列 `PostprocessorStep`（filtering、ranking、budget trim 等）串联成独立的可组合策略中间件。可附加 **SelectionDetail** 供调试。
_Avoid_: reranker, context manager

**Generator** (RuntimeGenerator):
基于 Chunks、Query 和 promptContext 生成文本答案的接口。
_Avoid_: completer, responder

**RelevanceScore**:
Retriever 返回的原始相关性分数，表示检索阶段的相关性评估。
_Avoid_: retrievalScore, raw score

**RerankingScore**:
Postprocessor 赋予的重排序分数，表示后处理阶段的重新评估。策略中用 `rerankingScore ?? relevanceScore` 回退。
_Avoid_: score, ranking score

**SelectionDetail**:
Postprocessor 返回的可选调试信息，包含 selectedCandidates、droppedCandidates、selectionTrace、appliedScoreThreshold、appliedBudget。
_Avoid_: debug info, trace result

**SelectionTrace**:
记录每个 candidate 在每个策略阶段的选择决策（kept/dropped/trimmed/reordered），完全承载选择状态。
_Avoid_: filter log, decision record

**Observer** (RAGObserver):
可选的观测接口，用于接收 runtime 各阶段的事件。不传 observer 时不影响原有行为。
_Avoid_: listener, subscriber

## Relationships

- **RAG Pipeline** 核心执行引擎是一个通用的 **DAG (有向无环图)**，通过 `executeDAG` 解析节点依赖并发执行。
- 默认的运行时管线依次包含节点：Preprocessor → Retriever → Postprocessor → Generator
- **Preprocessor** 输出 PreprocessedQuery，传给 Retriever
- **Retriever** 输出 RetrievalCandidate[]（携带 RelevanceScore），传给 Postprocessor
- **Postprocessor** 内部是一系列中间件步骤，执行 filtering → ranking → selection → context assembly，输出 candidates + promptContext + 可选 SelectionDetail
- **Generator** 结合 Query + candidates + promptContext 生成 RAGResponse
- 各阶段不再隐式依赖单体 Context，管线状态由 **DAG** 的依赖图传递。
- **Observer** 可选接入，在 DAG 节点边界发射事件，实现链路观测。

## Interface Layering

**Runtime 的接口是"运行时内部接口"** — 由 Runtime 包内部使用，支持更细粒度的控制：

- **RuntimeRetriever**: `retrieve(input: PreprocessedQuery): Promise<RuntimeRetrieverResult>` — 返回 RetrievalCandidate[] + RelevanceScore
- **RuntimeGenerator**: `generate(query: PreprocessedQuery, candidates: RetrievalCandidate[], promptContext: string | null): Promise<RuntimeGeneratorResult>` — 支持 promptContext 和详细调试信息

**用户不需要直接实现 Runtime 的接口**。用户应该实现 Core 的简单接口（Retriever、Generator），然后通过 Wrapper 模式桥接到 Runtime：

- **CoreRetrieverWrapper**: 将 Core.Retriever 包装为 RuntimeRetriever
- **CoreGeneratorWrapper**: 将 Core.Generator 包装为 RuntimeGenerator

**设计意图**：
- **用户层**：用户实现 Core 的简单接口，降低学习成本
- **运行时层**：Runtime 的复杂接口支持更细粒度的控制（如 RelevanceScore、SelectionDetail、promptContext）
- **桥接层**：Wrapper 模式使得用户实现可以无缝接入 Runtime 的复杂管线

**为什么需要两套接口？**
- Core 的接口简单，适合大多数用户场景
- Runtime 的接口复杂，支持高级功能（如重排序、预算裁剪、调试信息）
- Wrapper 模式使得用户可以渐进式地从简单接口迁移到复杂接口

## Example dialogue

> **Dev:** "**Retriever** 返回了 20 个 candidate，但 **Generator** 的上下文窗口只能放 5 个。"
> **Domain expert:** "所以 **Postprocessor** 内部先按 **RerankingScore** threshold 过滤，再 budget trim 裁剪到预算内，最后组装 promptContext 传给 **Generator**。**SelectionDetail** 里的 trace 会记录每一步的决策。"

> **Dev:** "我给 runtime 传了一个 **Observer**，现在能看到每个阶段的耗时了。"
> **Domain expert:** "对，**Observer** 会在 DAG 节点边界发射事件，包括 `runtime.retrieval.complete`、`runtime.post_retrieval.select` 等，你可以用这些事件来分析性能瓶颈。"
