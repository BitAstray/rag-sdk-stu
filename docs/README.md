# Docs 目录说明

本目录为 Vibe Coding 中的 AI 任务积累领域知识上下文。**文档首要读者是 AI。**

## 目录结构

| 目录 | 用途 |
|------|------|
| `architecture/` | 包依赖拓扑、关键决策索引 |
| `decisions/` | ADR（架构决策记录） |
| `plan/` | 各包设计文档（实施前的设计规格，含接口定义、数据模型、约束） |
| `eval/` | 评估框架 — 衡量 RAG 生成质量 |
| `indexing/` | 索引流程 — 离线数据构建 |
| `runtime/` | 在线 RAG 四阶段编排 — pre-retrieval → retrieval → post-retrieval → generation |
| `pipeline/` | Pipeline 设计 — 抽象层、可观测性 |
| `examples/` | 使用示例和最佳实践 |
| `sdk/` | SDK 安装和验证命令 |
| `archive/` | 已被 ADR 取代的历史规划文档 |

## 工作流

1. **任务前**：读取相关目录的 README 和 `plan/` 下的设计文档
2. **任务中**：参考领域知识上下文推进实现
3. **任务后**：同步更新相关文档
