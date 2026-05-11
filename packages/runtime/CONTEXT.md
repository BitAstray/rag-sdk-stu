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

## Relationships

- **RAG Pipeline** 核心执行引擎是一个通用的 **DAG (有向无环图)**，通过 `executeDAG` 解析节点依赖并发执行。
- 默认的运行时管线依次包含节点：Preprocessor → Retriever → Postprocessor → Generator
- **Preprocessor** 输出 PreprocessedQuery，传给 Retriever
- **Retriever** 输出 RetrievalCandidate[]（携带 RelevanceScore），传给 Postprocessor
- **Postprocessor** 内部是一系列中间件步骤，执行 filtering → ranking → selection → context assembly，输出 candidates + promptContext + 可选 SelectionDetail
- **Generator** 结合 Query + candidates + promptContext 生成 RAGResponse
- 各阶段不再隐式依赖单体 Context，管线状态由 **DAG** 的依赖图传递。

## Example dialogue

> **Dev:** "**Retriever** 返回了 20 个 candidate，但 **Generator** 的上下文窗口只能放 5 个。"
> **Domain expert:** "所以 **Postprocessor** 内部先按 **RerankingScore** threshold 过滤，再 budget trim 裁剪到预算内，最后组装 promptContext 传给 **Generator**。**SelectionDetail** 里的 trace 会记录每一步的决策。"
