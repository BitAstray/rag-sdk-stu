# 运行时阶段

> 如果你还没跑通快速上手，先看 [SDK 使用者指南](./sdk-user.md)。

运行时阶段负责接收用户查询，执行检索、后处理和生成，返回最终答案。这是 RAG 应用的在线查询环节。

## 四阶段管线

```
Query → Preprocessor → Retriever → Postprocessor → Generator → RAGResponse
         (预处理)       (检索)       (后处理)        (生成)
```

| 阶段 | 职责 | 接口 |
|------|------|------|
| Preprocessor | 查询改写、路由、扩展 | `QueryPreprocessor` |
| Retriever | 从向量存储检索相关片段 | `RuntimeRetriever` |
| Postprocessor | 过滤、排序、裁剪、组装上下文 | `RetrievalPostprocessor` |
| Generator | 基于上下文生成答案 | `RuntimeGenerator` |

## 快速上手

```ts
import { createDefaultRuntime } from "@rag-sdk/runtime"
import type { Retriever, Generator } from "@rag-sdk/core"

const runtime = createDefaultRuntime({
  retriever: {
    async retrieve(query) {
      // 你的检索逻辑
      return [{ id: "1", content: "relevant content" }]
    },
  },
  generator: {
    async generate({ query, chunks }) {
      // 你的生成逻辑
      return `Answer based on ${chunks.length} chunks`
    },
  },
})

const result = await runtime.run({ query: "What is RAG?" })
console.log(result.outputs.generator.value.answer)
```

`createDefaultRuntime` 内部使用 `NoopQueryPreprocessor`（透传查询）和 `PassthroughRetrievalPostprocessor`（透传候选），适合快速验证。

## 四个接口详解

### QueryPreprocessor

对查询进行预处理，输出 `PreprocessedQuery`：

```ts
interface QueryPreprocessor {
  preprocess(query: Query): Promise<PreprocessedQuery>
}

interface PreprocessedQuery {
  originalQuery: string    // 原始查询
  effectiveQuery: string   // 实际用于检索的查询（可能经过改写）
  topK?: number            // 建议返回数量
  filters?: Record<string, unknown>  // 过滤条件
  strategy?: string        // 检索策略
  route?: string           // 路由目标
  rewriteReason?: string   // 改写原因
}
```

示例——查询改写：

```ts
class RewritePreprocessor implements QueryPreprocessor {
  async preprocess(query: Query): Promise<PreprocessedQuery> {
    const rewritten = await llm.rewrite(query.query)
    return {
      originalQuery: query.query,
      effectiveQuery: rewritten,
      rewriteReason: "expanded abbreviations",
    }
  }
}
```

### RuntimeRetriever

根据预处理后的查询检索候选片段：

```ts
interface RuntimeRetriever {
  retrieve(input: PreprocessedQuery): Promise<RuntimeRetrieverResult>
}

interface RuntimeRetrieverResult {
  candidates: RetrievalCandidate[]
  debug?: RetrievalDebugData
}

interface RetrievalCandidate {
  id: string
  content: string
  metadata?: Record<string, unknown>
  relevanceScore?: number    // 检索阶段的原始相关性分数
  rerankingScore?: number    // 后处理阶段的重排序分数
  embedding?: number[]
  source?: string
}
```

### RetrievalPostprocessor

对检索结果进行后处理，输出过滤/排序后的候选和组装好的上下文：

```ts
interface RetrievalPostprocessor {
  postprocess(
    query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
  ): Promise<RetrievalPostprocessorResult>
}

interface RetrievalPostprocessorResult {
  candidates: RetrievalCandidate[]  // 最终候选
  promptContext: string | null       // 组装好的上下文文本
  detail?: SelectionDetail           // 调试详情
}
```

### RuntimeGenerator

基于候选和上下文生成答案：

```ts
interface RuntimeGenerator {
  generate(
    query: PreprocessedQuery,
    candidates: RetrievalCandidate[],
    promptContext: string | null,
  ): Promise<RuntimeGeneratorResult>
}

interface RuntimeGeneratorResult {
  answer: string | null
  debug?: GenerationDebugData
}
```

## Postprocessor 策略链

`createPostprocessorPipeline` 将多个 `PostprocessorStep` 串联成可组合的策略中间件：

```ts
import {
  createPostprocessorPipeline,
  scoreThreshold,
  budgetTrim,
  nearDuplicateRemoval,
  contextOrdering,
} from "@rag-sdk/runtime"

const postprocessor = createPostprocessorPipeline([
  scoreThreshold(0.5),           // 过滤低分候选
  nearDuplicateRemoval(),        // 去重
  budgetTrim({ maxCandidates: 5 }), // 限制数量
  contextOrdering(),             // 排序
])
```

### 内置策略

#### scoreThreshold(threshold)

按相关性分数过滤。使用 `rerankingScore ?? relevanceScore` 回退。

```ts
scoreThreshold(0.5)  // 丢弃分数低于 0.5 的候选
```

#### budgetTrim(budget)

按 token 预算裁剪：

```ts
budgetTrim({ maxCandidates: 5 })           // 最多保留 5 个候选
budgetTrim({ maxPromptChars: 4000 })       // 上下文最多 4000 字符
budgetTrim({ maxCandidates: 5, maxPromptChars: 4000 })  // 两者同时生效
```

#### predicateFilter(predicate)

自定义条件过滤：

```ts
predicateFilter(async ({ candidate, request }) => {
  // 只保留来自特定来源的候选
  return candidate.source === "official-docs"
})
```

#### nearDuplicateRemoval()

去除内容完全相同的候选：

```ts
nearDuplicateRemoval()
```

#### sourceCoverage(maxPerSource)

限制每个来源的最大候选数，避免单一来源主导：

```ts
sourceCoverage(3)  // 每个来源最多 3 个候选
```

#### contextOrdering(comparator?)

对候选排序。不传比较器则保持原序：

```ts
// 按分数降序
contextOrdering((a, b) => {
  const scoreA = a.rerankingScore ?? a.relevanceScore ?? 0
  const scoreB = b.rerankingScore ?? b.relevanceScore ?? 0
  return scoreB - scoreA
})
```

### 组合使用

```ts
import { createDefaultRuntime, createPostprocessorPipeline, scoreThreshold, budgetTrim, nearDuplicateRemoval } from "@rag-sdk/runtime"

const postprocessor = createPostprocessorPipeline([
  scoreThreshold(0.3),
  nearDuplicateRemoval(),
  budgetTrim({ maxCandidates: 10, maxPromptChars: 8000 }),
])

// 通过 createRuntime 自定义 postprocessor 节点
import { createRuntime } from "@rag-sdk/runtime"

const runtime = createRuntime({
  nodes: [
    // ... preprocessor, retriever 节点 ...
    {
      id: "postprocessor",
      dependencies: ["preprocessor", "retriever"],
      execute: async (inputs) => {
        return postprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates)
      },
    },
    // ... generator 节点 ...
  ],
})
```

## 返回值解读

`runtime.run()` 返回 `DAGExecutionResult`：

```ts
interface DAGExecutionResult {
  outputs: {
    preprocessor: { value: PreprocessedQuery; durationMs: number }
    retriever:    { value: RuntimeRetrieverResult; durationMs: number }
    postprocessor:{ value: RetrievalPostprocessorResult; durationMs: number }
    generator:    { value: RuntimeGeneratorResult; durationMs: number }
  }
  durationMs: number
}
```

常用访问：

```ts
const result = await runtime.run({ query: "..." })

// 生成的答案
const answer = result.outputs.generator.value.answer

// 最终候选列表
const candidates = result.outputs.postprocessor.value.candidates

// 组装好的上下文
const context = result.outputs.postprocessor.value.promptContext

// 各阶段耗时
const retrievalMs = result.outputs.retriever.durationMs
const generationMs = result.outputs.generator.durationMs
```

## 调试能力

Postprocessor 返回可选的 `SelectionDetail`，记录每个候选在每个策略阶段的决策：

```ts
const detail = result.outputs.postprocessor.value.detail

if (detail) {
  // 被丢弃的候选
  console.log("Dropped:", detail.droppedCandidates.map(c => c.id))

  // 选择追踪
  for (const trace of detail.selectionTrace) {
    console.log(`[${trace.stage}] ${trace.candidateId}: ${trace.action}`)
    if (trace.reason) console.log(`  Reason: ${trace.reason}`)
  }

  // 应用的阈值和预算
  console.log("Score threshold:", detail.appliedScoreThreshold)
  console.log("Budget:", detail.appliedBudget)
}
```

### SelectionTraceItem 结构

```ts
interface SelectionTraceItem {
  stage: string           // 策略阶段名（如 "score-threshold"）
  action: "kept" | "dropped" | "trimmed" | "reordered"
  candidateId: string
  reason?: string         // 丢弃/裁剪原因
  metadata?: Record<string, unknown>
}
```

## 自定义 DAG 管线

> 高级用法。大多数场景用 `createDefaultRuntime` 即可。

`createRuntime` 接受 `DAGNode[]`，通过依赖图自动解析执行顺序：

```ts
import { createRuntime } from "@rag-sdk/runtime"
import type { DAGNode } from "@rag-sdk/runtime"

const nodes: DAGNode[] = [
  {
    id: "preprocessor",
    dependencies: ["query"],
    execute: async (inputs) => myPreprocessor.preprocess(inputs.query),
  },
  {
    id: "retriever",
    dependencies: ["preprocessor"],
    execute: async (inputs) => myRetriever.retrieve(inputs.preprocessor),
  },
  {
    id: "postprocessor",
    dependencies: ["preprocessor", "retriever"],
    execute: async (inputs) => myPostprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates),
  },
  {
    id: "generator",
    dependencies: ["preprocessor", "postprocessor"],
    execute: async (inputs) => myGenerator.generate(inputs.preprocessor, inputs.postprocessor.candidates, inputs.postprocessor.promptContext),
  },
]

const runtime = createRuntime({ nodes })
const result = await runtime.run({ query: "What is RAG?" })
```

### DAG 引擎特性

- **自动并发**：无依赖关系的节点并行执行
- **循环检测**：自动检测并报告循环依赖
- **错误定位**：错误信息包含失败节点 ID 和原始错误
- **性能追踪**：每个节点记录 `durationMs`

### 添加自定义节点

可以在标准四阶段之外添加自定义节点：

```ts
const nodes: DAGNode[] = [
  // ... 标准节点 ...
  {
    id: "metrics",
    dependencies: ["generator"],  // 在 generator 之后执行
    execute: async (inputs) => {
      const answer = inputs.generator.answer
      await recordMetrics({ answerLength: answer?.length ?? 0 })
      return { recorded: true }
    },
  },
]
```

## 错误处理

```ts
import { RuntimeError, wrapStageError } from "@rag-sdk/runtime"
import type { RuntimeStage } from "@rag-sdk/runtime"

try {
  const result = await runtime.run({ query: "..." })
} catch (err) {
  if (err instanceof RuntimeError) {
    console.error(`Stage ${err.stage} failed:`, err.message)
  }
}
```

## 下一步

- 想自定义适配器接入外部服务？看 [扩展指南](./adapters.md)
- 想了解索引阶段？看 [索引阶段](./indexing.md)
