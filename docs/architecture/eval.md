# Eval 包

评估框架。衡量 RAG Pipeline 的生成质量。

## 职责

- 管理评估数据集（Dataset：查询 + 期望答案/引用）
- 执行评估流程（Runner：运行 Pipeline 并收集结果）
- 质量评判（Judge：对输出计算 Faithfulness、Relevance 等指标）

## 目录结构

```
src/
  index.ts        公共 API 导出
```

## 评估流程

```mermaid
graph LR
    DS[Dataset] -->|Query[]| R[Runner]
    R -->|执行| P[Pipeline]
    P -->|RAGResponse| J[Judge]
    J -->|计算| M[Metric]
```
