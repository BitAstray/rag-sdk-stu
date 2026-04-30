# CLAUDE.md

RAG SDK Monorepo — TypeScript，pnpm workspace。**类型检查用 `tsgo` 而非 `tsc`**（`@typescript/native-preview`）。

## 包管理规则

- 根目录 `-w -D`：仅开发工具（Vitest、tsup 等）
- 子包：运行时依赖谁用谁声明，pnpm 自动去重
- 包名：`@rag-sdk/{group}`，单包模式，`main` 和 `types` 指向 `./src/index.ts`
- 新建包三件套：`package.json`、`tsconfig.json`（extends 根，`include: ["src", "__tests__"]`）、`src/index.ts`

## 7 个包分组

| 分组 | 职责 |
|------|------|
| `core` | 类型定义、接口、管线抽象、错误类型 |
| `runtime` | 四阶段在线编排（pre-retrieval → retrieval → post-retrieval → generation），依赖 `core` |
| `indexing` | 加载、分块、嵌入、写入、管线 |
| `adapters` | 外部服务适配器（LLM、向量存储等） |
| `observability` | 钩子、追踪、指标 |
| `eval` | 数据集、运行器、指标、评判器 |
| `utils` | 日志、配置、辅助函数 |

## 文档工作流（强制）

**任务前：读 docs 文档。任务后：更新 docs 文档。** 文档首要读者是 AI。

**必须评估 `CLAUDE.md` 是否需要更新新的内容**

撰写规范：言简意赅，不重复已有的内容。

## 五层验证（强制）

1. **Type** — `tsgo`，严禁类型错误
2. **Spec** — Zod Schema `.parse()` 校验（core 强制）
3. **Unit** — `__tests__/`，核心逻辑覆盖
4. **Demo** — `demo/` 最小闭环
5. **集成 + 冒烟** — `tests/integration/` + `tests/smoke/`

开发流水线：`typecheck` → `test` → `demo` → `test:integration` → `test:smoke`（或 `pnpm verify` 全链路）

## 禁止事项

- 禁止缺失 Demo 或测试
- 禁止仅依赖手动验证
- 禁止在 `runtime` 内写评测指标（归 `eval` 包）
