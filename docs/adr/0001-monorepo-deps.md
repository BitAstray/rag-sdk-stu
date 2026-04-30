# ADR-001: Monorepo 依赖安装策略

## 状态

已采纳

## 背景

本项目为 RAG SDK Monorepo，使用 pnpm workspace 管理 7 个包分组（core、runtime、indexing、adapters、observability、eval、utils），每个分组为一个独立包。

在 monorepo 架构中，依赖安装位置直接影响包的可移植性、可维护性和磁盘效率。

## 决策

### 根目录安装（`-w -D`）

开发工具类依赖、全局构建类依赖。

```bash
pnpm add @typescript/native-preview -w -D
```

典型依赖：TypeScript、Vitest、tsx

### 子包安装

运行时依赖。`cd packages/{group} && pnpm add <dep>`

典型依赖：zod、openai、lodash-es

### 核心原则

**谁使用，谁声明；接口依赖必选 dependencies。**

## 原因

1. **显式依赖**：每个子包的 `package.json` 能独立描述其运行依赖
2. **版本一致性**：开发工具装在根目录保证整个项目使用同一版本
3. **pnpm 去重**：符号链接处理重复依赖，磁盘上只有一份物理存储
