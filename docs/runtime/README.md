# Runtime — 在线 RAG 四阶段编排层

面向 SDK 的在线查询编排，将原始查询转化为结构化回答。

```mermaid
graph LR
    A[Query] --> B[Preprocessor]
    B --> C[Retriever]
    C --> D[Postprocessor]
    D --> E[Generator]
    E --> F[RuntimeResult]
```

## 四阶段

| 阶段 | 接口 | 职责 |
|------|------|------|
| pre-retrieval | `QueryPreprocessor` | query 改写/规范化/路由/参数决策 |
| retrieval | `RuntimeRetriever` | 召回候选 chunks |
| post-retrieval | `RetrievalPostprocessor` | rerank/trim/去重/context 组装 |
| generation | `RuntimeGenerator` | 基于最终上下文生成回答 |

## 核心入口

```ts
import { createRuntime, createDefaultRuntime } from "@rag-sdk/runtime"

// 最简接入：传入 core 的 Retriever + Generator
const runtime = createDefaultRuntime({ retriever, generator })
const result = await runtime.run({ query: "什么是 RAG?" })

// 完全控制：自定义四阶段
const runtime = createRuntime({
  retriever: customRuntimeRetriever,
  generator: customRuntimeGenerator,
  preprocessor: customPreprocessor,
  postprocessor: customPostprocessor,
})
```

## 接口区分

- **core 接口** (`Retriever`, `Generator`)：简单签名，`createRuntime` 自动包装
- **runtime 接口** (`RuntimeRetriever`, `RuntimeGenerator`)：带 `context` 和 `debug`，需设置 brand 属性 (`__runtimeRetriever: true` / `__runtimeGenerator: true`)

## 结构

```
src/
  spec/         # Zod schemas（运行时校验源）
  types/        # TS 类型（z.infer 派生）
  interfaces/   # 四阶段抽象接口
  pipeline/     # createRuntime() + runRuntime()
  defaults/     # Noop/Passthrough/Wrapper 默认实现
  errors/       # RuntimeError + RuntimeStage
```

用法见 `packages/runtime/demo/`。
