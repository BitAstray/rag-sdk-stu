# Core 包

共享数据类型和管线抽象层。所有其他包依赖 Core 获取统一的类型定义。

## 职责

- 定义 RAG 领域核心数据类型：Document、Chunk、Vector、Query、RAGResponse
- 提供 Zod Schema 用于运行时校验（Spec 验证层）
- 定义 Retriever 和 Generator 基础接口
- 提供统一错误类型体系（RagError 及子类）

## 目录结构

```
src/
  spec/           Zod Schema 定义 + 推导的 TS 类型
    metadata.ts   MetadataValue 元数据值类型
    document.ts   Document Schema + 类型
    chunk.ts      Chunk Schema + 类型
    vector.ts     Vector Schema + 类型
    query.ts      Query Schema + 类型
    rag-response.ts  RAGResponse Schema + 类型
    index.ts      barrel 导出
  interfaces/     基础接口定义
    retriever.ts  Retriever 接口
    generator.ts  Generator 接口
  pipeline/       管线类型抽象
    types.ts      RAGPipeline 函数类型
  errors/         错误类型体系
    base.ts       RagError 基类 + createRagError 工厂
    validation.ts ValidationError
    retrieval.ts  RetrievalError
    generation.ts GenerationError
  index.ts        公共 API 导出
__tests__/        单元测试
  spec/           Schema 校验测试
  interfaces/     接口类型兼容测试
  errors/         错误类测试
```

## 数据流

```mermaid
graph LR
    D[Document] -->|切分| C[Chunk]
    C -->|嵌入| V[Vector]
    Q[Query] -->|检索| C
    C + Q -->|生成| R[RAGResponse]
```
