# Core

RAG SDK 的共享数据类型和管线抽象层。所有其他包依赖 Core 获取统一的类型定义。

## Language

**Document**:
用户输入的原始文档，包含文本内容和可选元数据。
_Avoid_: file, source, input

**Chunk**:
Document 被切分后的片段，必须指向其源 Document。包含文本内容、元数据和源文档引用。
_Avoid_: segment, fragment, piece

**Vector**:
Chunk 经过嵌入模型转换后的数值向量表示，用于相似度检索。
_Avoid_: embedding（动词形式易混淆）

**Query**:
用户的检索查询请求，包含查询文本。
_Avoid_: search, question

**RAGResponse**:
RAG Pipeline 的最终输出，包含生成的答案和引用的 Chunks。
_Avoid_: result, output, answer

**Pipeline**:
一系列处理阶段的类型抽象，以函数类型定义。
_Avoid_: chain, workflow

**MetadataValue**:
元数据值的联合类型，支持 string、number、boolean、null、string[]。
_Avoid_: meta, attribute

## Relationships

- 一个 **Document** 被切分为多个 **Chunk**
- 一个 **Chunk** 指向一个 **Document**（documentId）
- 一个 **Chunk** 被嵌入为一个 **Vector**
- 一个 **Query** 触发一条 **RAG Pipeline**
- 一条 **RAG Pipeline** 产出一个 **RAGResponse**
- 一个 **RAGResponse** 包含答案文本和引用的 **Chunk[]**

## Example dialogue

> **Dev:** "当用户提交一个 **Query** 时，我们需要从 **VectorStore** 中检索相关的 **Chunk**，然后传给 **Generator** 生成 **RAGResponse**。"
> **Domain expert:** "对，但检索到的是 **Vector**，需要反查对应的 **Chunk** 才能传给 Generator。"

## Flagged ambiguities

- "embedding" 既指嵌入过程（动词）也指嵌入结果（名词）— 已解决：过程用 "embed"，结果用 **Vector**。
