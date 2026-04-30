# ADR-002: 验证体系设计

## 状态

已采纳

## 背景

RAG SDK 为 7 个包分组的 monorepo 架构。AI 生成代码在多包架构下存在类型错误传播、运行时数据不一致、跨包集成问题等风险。

## 决策

采用五层验证闭环：

| 层级 | 验证方式 | 工具 | 强制范围 |
|------|----------|------|----------|
| 1. Type | 静态类型检查 | tsgo | 所有包 |
| 2. Spec | 运行时 Schema 校验 | Zod | core 包 |
| 3. Unit | 单元逻辑测试 | Vitest | 核心包 |
| 4. Demo | 包级最小可运行示例 | tsx | 所有包 |
| 5. 集成 + 冒烟 | 跨包协同 / 端到端 | Vitest | 全局 |

### 技术栈

仅允许：TypeScript（tsgo）、Vitest、Zod、tsx

### 目录约定

```
packages/{group}/
  __tests__/       单元测试
  demo/            最小可运行示例
tests/
  integration/     跨包集成测试
  smoke/           冒烟测试
```

### 根目录脚本

```json
{
  "typecheck": "pnpm -r exec tsgo --noEmit",
  "test": "vitest run --project unit",
  "test:integration": "vitest run --project integration",
  "test:smoke": "vitest run --project smoke",
  "verify": "pnpm run check && pnpm run test:integration && pnpm run test:smoke"
}
```

## 原因

1. 统一工具链：四件套覆盖从静态到动态的全部验证需求
2. 逐层递进：Type → Spec → Unit → Demo → 集成
3. 独立自治：每个包可独立验证
4. AI 友好：Demo 是最小可运行示例
