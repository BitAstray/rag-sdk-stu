# ADR-001: Monorepo 依赖安装策略

## 状态

已采纳

## 背景

本项目为 RAG SDK Monorepo，使用 pnpm workspace 管理 7 个包分组（core、runtime、indexing、adapters、observability、eval、utils），每个分组为一个独立包。

在 monorepo 架构中，依赖安装位置直接影响包的可移植性、可维护性和磁盘效率。需要明确哪些依赖装在根目录，哪些装在子包。

## 决策

### 根目录安装（`-w -D`）

**适用范围：** 开发工具类依赖、全局构建类依赖。

**安装命令：**
```bash
pnpm add @typescript/native-preview -w -D
```

**典型依赖：**
- TypeScript（`@typescript/native-preview`）— 确保整个项目编译器版本统一
- ESLint — 代码质量检查
- Prettier — 代码格式化
- Vitest — 测试框架
- tsup — 打包工具

### 子包安装

**适用范围：** 运行时依赖。

**安装命令：**
```bash
cd packages/runtime/retriever
pnpm add zod
```

**典型依赖：**
- zod — 运行时验证
- openai — LLM 调用
- lodash-es — 工具函数

### 核心原则

**谁使用，谁声明；接口依赖必选 dependencies。**

## 原因

1. **显式依赖**：每个子包的 `package.json` 能独立描述其运行依赖。若 SDK 的导出接口或类型依赖于第三方包（如 `zod` 的 Schema），则该包**必须**声明为 `dependencies` 而非 `devDependencies`，以保证用户安装该包时能自动补齐依赖。
2. **版本一致性**：开发工具装在根目录保证整个项目使用同一版本，避免包间类型冲突。
3. **pnpm 去重**：pnpm 通过符号链接（Symbolic Links）处理重复依赖，即使 5 个子包都装了 zod，磁盘上也只有一份物理存储，不会浪费空间。

## 后果

- 安装运行时依赖时需要 `cd` 到对应子包目录，不能在根目录直接安装
- 新子包创建时，需根据其实际依赖逐个安装，不能假设根目录已有所需依赖
- 每个子包的 `package.json` 应保持自描述，便于独立发布和审计
