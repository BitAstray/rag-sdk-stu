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

- **Indexing Pipeline** 执行顺序：Loader → DocumentTransformer → Chunker → Embedder → VectorStore
- **Loader** 产出 Document[]
- **DocumentTransformer** 输入/输出 Document[]（可选阶段）
- **Chunker** 输入 Document[]，输出 Chunk[]
- **Embedder** 输入 Chunk[]，输出 Vector[]
- **VectorStore** 接收 Vector[] 并持久化

## Example dialogue

> **Dev:** "**Loader** 从 Markdown 文件读取内容生成 **Document**，然后 **Chunker** 按段落切分成 **Chunk**。"
> **Domain expert:** "切分后需要 **Embedder** 调用嵌入模型生成 **Vector**，最后写入 **VectorStore**。"
