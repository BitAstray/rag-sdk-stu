# Indexing

索引管线的定义和执行。负责将原始 Document 加载、切分、嵌入并写入向量存储。

## Language

**Loader**:
从外部源读取原始数据并转换为 Document 的接口。
_Avoid_: reader, importer

**Chunker**:
将 Document 切分为多个 Chunk 的接口。
_Avoid_: splitter, segmenter

**Embedder**:
将 Chunk[] 转换为 Vector[] 的接口，调用嵌入模型。
_Avoid_: encoder

**VectorStore**:
存储和检索 Vector 的接口。
_Avoid_: vector database, vector db

**DocumentTransformer**:
对 Document 进行预处理转换的接口（清洗、过滤等）。
_Avoid_: preprocessor, filter

## Relationships

- **Indexing Pipeline** 采用基于 **AsyncIterable** 的流式处理架构 (`IndexingStream`)
- 使用 `PipelineSteps.fromLoader` 作为起点产出流，随后通过 `.pipe()` 接入其他步骤。
- **Loader** 作为数据源产出 Document 流
- **DocumentTransformer** 输入/输出 Document 流（可选过滤阶段）
- **Chunker** 将 Document 流切分成 Chunk 流
- **Embedder** 将 Chunk 流转换为 Vector 流
- **VectorStore** 消费 Vector 流并持久化

## Example dialogue

> **Dev:** "**Loader** 从 Markdown 文件读取内容生成 **Document**，然后 **Chunker** 按段落切分成 **Chunk**。"
> **Domain expert:** "切分后需要 **Embedder** 调用嵌入模型生成 **Vector**，最后写入 **VectorStore**。"
