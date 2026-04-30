# Domain Docs

工程技能在探索代码库时如何消费本仓库的领域文档。

## 探索前先读这些

- **`CONTEXT-MAP.md`**（仓库根目录）— 指向各子目录的 `CONTEXT.md`，读取与当前主题相关的上下文
- **`docs/decisions/`** — 阅读与当前工作区域相关的 ADR（架构决策记录）

如果这些文件不存在，**静默跳过**。不要标记其缺失，也不要主动建议创建。生产者技能（`/grill-with-docs`）会在术语或决策实际被解决时懒创建它们。

## 文件结构

多上下文仓库（本仓库采用此模式）：

```
/
├── CONTEXT-MAP.md
├── docs/decisions/                    ← 系统级决策
│   ├── ADR-001-monorepo-dependency-installation-strategy.md
│   └── ADR-002-verification-system.md
└── packages/
    ├── core/
    │   └── CONTEXT.md
    ├── runtime/
    │   └── CONTEXT.md
    ├── indexing/
    │   └── CONTEXT.md
    ├── adapters/
    │   └── CONTEXT.md
    ├── observability/
    │   └── CONTEXT.md
    ├── eval/
    │   └── CONTEXT.md
    └── utils/
        └── CONTEXT.md
```

## 使用术语表的词汇

当输出中涉及领域概念时（Issue 标题、重构提案、假设、测试名称），使用 `CONTEXT.md` 中定义的术语。不要偏离术语表明确避免的同义词。

如果需要的概念尚未在术语表中，这是一个信号 — 要么你正在发明项目不使用的语言（需重新考虑），要么存在真正的缺口（记录下来供 `/grill-with-docs` 使用）。

## 标记 ADR 冲突

如果输出与现有 ADR 矛盾，明确指出而非静默覆盖：

> _与 ADR-001（Monorepo 依赖安装策略）矛盾 — 但值得重新讨论，因为……_
