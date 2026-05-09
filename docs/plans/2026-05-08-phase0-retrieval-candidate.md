# Phase 0: RetrievalCandidate 类型迁移

## 目标

将 runtime 包从直接使用 core/Chunk 迁移为使用 runtime 自有的 `RetrievalCandidate` 类型。纯粹类型迁移，不增强 postprocessor 能力。

## 决策依据

- Chunk 是 indexing 产物（Document → 分块 → Chunk），runtime 不应直接依赖
- 向量数据库返回的是 Chunk + 检索元数据的组合，需要 runtime 自己的信封类型
- Phase 1 的 postprocessor 增强（score threshold、budget trim、trace）需要 Candidate 作为基础

## 新增文件

### 1. `packages/runtime/src/spec/retrieval-candidate.ts`

```ts
import { z } from "zod"

export const RetrievalCandidateSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  retrievalScore: z.number().optional(),
  score: z.number().optional(),
  embedding: z.array(z.number()).optional(),
  source: z.string().optional(),
})

export type RetrievalCandidate = z.infer<typeof RetrievalCandidateSchema>
```

字段说明：
- `id`, `content`, `metadata` — 对应 Chunk 的内容字段，metadata 约束比 core 更宽（`unknown` vs `MetadataValue`）
- `retrievalScore` — 可选，retriever 带回的相似度分数
- `score` — 可选，reranker/postprocessor 产生的最终分数（Phase 1 用）
- `embedding` — 可选，原始向量（near-duplicate detection 等场景用）
- `source` — 可选，来源标识（source coverage 用）

## 修改文件

### 2. `packages/runtime/src/spec/context.ts`

```diff
- import type { Query, Chunk } from "@rag-sdk/core"
- import { ChunkSchema, QuerySchema } from "@rag-sdk/core"
+ import type { Query } from "@rag-sdk/core"
+ import { QuerySchema } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "./retrieval-candidate.js"
+ import { RetrievalCandidateSchema } from "./retrieval-candidate.js"

  export const RuntimeContextSchema = z.object({
    originalQuery: QuerySchema,
    preprocessed: PreprocessedQuerySchema.nullable(),
-   chunks: z.array(ChunkSchema),
+   candidates: z.array(RetrievalCandidateSchema),
    promptContext: z.string().nullable(),
    metadata: z.record(z.unknown()),
  })

  export interface RuntimeContext {
    originalQuery: Query
    preprocessed: PreprocessedQuery | null
-   chunks: Chunk[]
+   candidates: RetrievalCandidate[]
    promptContext: string | null
    metadata: RuntimeMetadata
  }
```

### 3. `packages/runtime/src/spec/stage-result.ts`

```diff
- import { ChunkSchema } from "@rag-sdk/core"
+ import { RetrievalCandidateSchema } from "./retrieval-candidate.js"

  export const RetrievalResultSchema = z.object({
-   chunks: z.array(ChunkSchema),
+   candidates: z.array(RetrievalCandidateSchema),
    retrievedCount: z.number().int().nonnegative(),
    durationMs: z.number().nonnegative(),
  })

  export const PostRetrievalResultSchema = z.object({
-   chunks: z.array(ChunkSchema),
+   candidates: z.array(RetrievalCandidateSchema),
    promptContext: z.string().nullable(),
    removedCount: z.number().int().nonnegative(),
    durationMs: z.number().nonnegative(),
  })
```

### 4. `packages/runtime/src/spec/runtime-result.ts`

```diff
- import { ChunkSchema, QuerySchema } from "@rag-sdk/core"
+ import { QuerySchema } from "@rag-sdk/core"
+ import { RetrievalCandidateSchema } from "./retrieval-candidate.js"

  export const RuntimeResultSchema = z.object({
    answer: z.string().nullable(),
-   chunks: z.array(ChunkSchema),
+   candidates: z.array(RetrievalCandidateSchema),
    ...
  })
```

### 5. `packages/runtime/src/interfaces/runtime-retriever.ts`

```diff
- import type { Chunk } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  export interface RuntimeRetrieverResult {
-   chunks: Chunk[]
+   candidates: RetrievalCandidate[]
    debug?: RetrievalDebugData
  }
```

### 6. `packages/runtime/src/interfaces/retrieval-postprocessor.ts`

```diff
- import type { Chunk } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  export interface RetrievalPostprocessorResult {
-   chunks: Chunk[]
+   candidates: RetrievalCandidate[]
    promptContext: string | null
    debug?: PostRetrievalDebugData
  }

  export interface RetrievalPostprocessor {
    postprocess(
      query: PreprocessedQuery,
-     chunks: Chunk[],
+     candidates: RetrievalCandidate[],
      context: RuntimeContext,
    ): Promise<RetrievalPostprocessorResult>
  }
```

### 7. `packages/runtime/src/interfaces/runtime-generator.ts`

```diff
- import type { Chunk } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  export interface RuntimeGenerator {
    generate(
      query: PreprocessedQuery,
-     chunks: Chunk[],
+     candidates: RetrievalCandidate[],
      promptContext: string | null,
      context: RuntimeContext,
    ): Promise<RuntimeGeneratorResult>
  }
```

### 8. `packages/runtime/src/pipeline/run-runtime.ts`

全文 `chunks` → `candidates`：
- `context.chunks = []` → `context.candidates = []`
- `context.chunks = chunks` → `context.candidates = candidates`
- 解构 `const { chunks, debug }` → `const { candidates, debug }`
- `retrievalResult.chunks.length` → `retrievalResult.candidates.length`
- `chunks: postRetrievalResult.chunks` → `candidates: postRetrievalResult.candidates`

### 9. `packages/runtime/src/defaults/retriever-wrapper.ts`

```diff
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  async retrieve(input, _context): Promise<RuntimeRetrieverResult> {
    try {
      const chunks = await this.inner.retrieve({ query: input.effectiveQuery })
-     return { chunks }
+     const candidates: RetrievalCandidate[] = chunks.map(c => ({
+       id: c.id,
+       content: c.content,
+       metadata: c.metadata as Record<string, unknown> | undefined,
+     }))
+     return { candidates }
    }
  }
```

### 10. `packages/runtime/src/defaults/generator-wrapper.ts`

```diff
- import type { Generator, Chunk } from "@rag-sdk/core"
+ import type { Generator, Chunk, MetadataValue } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  async generate(
    query: PreprocessedQuery,
-   chunks: Chunk[],
+   candidates: RetrievalCandidate[],
    _promptContext: string | null,
    _context: RuntimeContext,
  ): Promise<RuntimeGeneratorResult> {
    try {
+     const chunks: Chunk[] = candidates.map(c => ({
+       id: c.id,
+       content: c.content,
+       metadata: c.metadata as Record<string, MetadataValue> | undefined,
+     }))
      const answer = await this.inner.generate({
        query: { query: query.effectiveQuery },
        chunks,
      })
    }
  }
```

### 11. `packages/runtime/src/defaults/passthrough-postprocessor.ts`

```diff
- import type { Chunk } from "@rag-sdk/core"
+ import type { RetrievalCandidate } from "../spec/retrieval-candidate.js"

  async postprocess(
    _query: PreprocessedQuery,
-   chunks: Chunk[],
+   candidates: RetrievalCandidate[],
    _context: RuntimeContext,
  ): Promise<RetrievalPostprocessorResult> {
-   return { chunks, promptContext: null }
+   return { candidates, promptContext: null }
  }
```

### 12. `packages/runtime/src/spec/index.ts`

新增 export `RetrievalCandidateSchema` 和 `RetrievalCandidate`。

### 13. `packages/runtime/src/index.ts`

新增 export `RetrievalCandidateSchema` 和 `RetrievalCandidate`。

## 测试更新

所有 `chunks` 引用改为 `candidates`，测试数据从 `Chunk` 改为 `RetrievalCandidate`：

- `__tests__/spec/stage-result.test.ts` — `RetrievalResultSchema` 和 `PostRetrievalResultSchema` 测试数据
- `__tests__/spec/runtime-result.test.ts` — `RuntimeResultSchema` 测试数据
- `__tests__/defaults/passthrough-postprocessor.test.ts` — 输入输出类型
- `__tests__/defaults/retriever-wrapper.test.ts` — 验证返回 `candidates`
- `__tests__/defaults/generator-wrapper.test.ts` — 输入改为 `candidates`
- `__tests__/defaults/create-default-runtime.test.ts` — 结果字段验证
- `__tests__/pipeline/run-runtime.test.ts` — 全部 `chunks` → `candidates`
- `__tests__/pipeline/create-runtime.test.ts` — 如果有 chunks 引用

## Demo 更新

`demo/index.ts` — 所有 `chunks` 引用改为 `candidates`，打印内容适配新类型。

## 文档更新

- `packages/runtime/CONTEXT.md` — 已在 grill session 中更新
- `docs/adr/0005-runtime-retrieval-candidate.md` — 新增 ADR 记录此决策

## 验证命令

```bash
pnpm --filter @rag-sdk/runtime build    # tsgo 类型检查
pnpm --filter @rag-sdk/runtime test     # vitest 单元测试
pnpm --filter @rag-sdk/runtime demo     # tsx demo
```

## 不在范围内

- postprocessor 增强（score threshold、budget trim、trace）→ Phase 1
- near-duplicate removal → Phase 1
- source coverage → Phase 1
- context ordering → Phase 1
- `RetrievalCandidate` 上的 `kept`/`droppedReason` 字段 → Phase 1（与 trace 一起加）
