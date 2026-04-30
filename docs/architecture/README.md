# 架构总览

RAG SDK 的包依赖拓扑和关键决策索引。

## 包依赖拓扑

```
utils (底层工具)
  ↑
core (类型、接口、错误) ← 仅依赖 utils
  ↑
adapters (外部服务适配器) ← 依赖 core
  ↑
runtime (四阶段在线编排) ← 仅依赖 core
indexing (离线索引管线) ← 依赖 core, adapters, utils
  ↑
eval (评估框架) ← 依赖 runtime, core, utils
```

**Observability** 作为横切关注点，可被其它包引用，通常仅依赖 core。

**禁止循环依赖。**

## 关键决策

| 编号 | 决策 | 状态 |
|------|------|------|
| [ADR-001](../decisions/ADR-001-monorepo-dependency-installation-strategy.md) | Monorepo 依赖安装策略 | 已采纳 |
| [ADR-002](../decisions/ADR-002-verification-system.md) | 验证体系设计 | 已采纳 |
| [ADR-003](../decisions/ADR-003-adapters-structure-and-abstraction.md) | adapters 包结构与第三方抽象策略 | 已采纳 |
