# 仓库开发者指南

## 环境要求

- Node.js >= 18
- pnpm >= 9

## 克隆与安装

```bash
git clone <repo-url>
cd rag-sdk-stu
pnpm install
```

## 开发命令

| 命令 | 用途 |
|------|------|
| `pnpm run typecheck` | 类型检查（tsgo） |
| `pnpm run test` | 单元测试 |
| `pnpm run test:integration` | 集成测试 |
| `pnpm run test:smoke` | 冒烟测试 |
| `pnpm run check` | typecheck + test |
| `pnpm run verify` | 全链路验证（check + integration + smoke） |

## 五层验证

每次提交前必须通过五层验证（`pnpm verify`）：

1. **Type** — `tsgo` 静态类型检查，严禁类型错误
2. **Spec** — Zod Schema `.parse()` 运行时校验（core 包强制）
3. **Unit** — `__tests__/` 单元测试，核心逻辑覆盖
4. **Demo** — `demo/` 最小可运行示例
5. **集成 + 冒烟** — `tests/integration/` 跨包协同 + `tests/smoke/` 端到端闭环

开发流水线：`typecheck` → `test` → `demo` → `test:integration` → `test:smoke`

## 包管理规则

- 根目录 `-w -D`：仅开发工具（Vitest、tsx 等）
- 子包：运行时依赖谁用谁声明，pnpm 自动去重
- 安装子包依赖：`cd packages/{group} && pnpm add <dep>`

## 新增包

三件套：`package.json`、`tsconfig.json`（extends 根）、`src/index.ts`

## 新增 Adapter

1. 在 `packages/adapters/src/{provider}/` 下创建目录
2. 实现对应接口（`Loader`、`Chunker`、`Embedder`、`VectorStore`）
3. 在 `packages/adapters/src/index.ts` 中导出
4. 编写 `__tests__/` 和 `demo/`

## 目录结构

```
packages/
  core/           共享类型、Schema、接口、错误
  runtime/        在线查询编排（4 阶段管线）
  indexing/       离线索引构建
  adapters/       外部服务适配器
  observability/  钩子、追踪、指标
  eval/           评估框架
  utils/          日志、配置工具
tests/
  integration/    跨包集成测试
  smoke/          冒烟测试（端到端）
docs/
  usage/          使用指南
  architecture/   架构文档
  adr/            架构决策记录
```
