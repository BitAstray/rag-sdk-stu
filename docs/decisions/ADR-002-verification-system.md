# ADR-002: 验证体系设计

## 状态

已采纳

## 背景

RAG SDK 为 7 个包分组的 monorepo 架构（每个分组为一个独立包）。AI 生成代码在多包架构下存在以下风险：

- 类型错误在包间传播而不被发现
- 运行时数据结构不一致导致静默失败
- 跨包集成问题难以定位
- 修改一个包导致其他包回归

需要建立统一的验证体系，确保工程质量。

## 决策

采用五层验证闭环，从静态到动态、从单元到集成逐层递进：

### 五层验证

| 层级 | 验证方式 | 工具 | 强制范围 |
|------|----------|------|----------|
| 1. Type 验证 | 静态类型检查 | TypeScript 7 (`tsgo`) | 所有包 |
| 2. Spec 验证 | 运行时 Schema 校验 | Zod | core 包 |
| 3. Unit Test | 单元逻辑测试 | Vitest | 核心包 |
| 4. Demo 验证 | 包级最小可运行示例 | tsx | 所有包 |
| 5. 集成 + 冒烟 | 跨包协同 / 端到端闭环 | Vitest | 全局 |

### 技术栈

仅允许以下工具，不引入额外测试框架：

- **TypeScript** — 使用 `@typescript/native-preview` 提供的 `tsgo` 命令（Go 重写版，高性能）进行全局类型检查。
- **Vitest** — 统一测试运行框架。
- **Zod** — Schema 定义与数据校验。
- **tsx** — 直接运行 TypeScript Demo 脚本。

### 目录约定

每个子包内需包含：
```
packages/{group}/{module}/
  __tests__/       # 单元测试
  demo/            # 最小可运行示例（入口必须为 index.ts）
```

根目录（Root）：
```
tests/
  integration/     # 跨包集成测试（如 core+runtime、runtime+adapters）
  smoke/           # 冒烟测试（Query → Answer 最小闭环）
```

### 根目录脚本

```json
{
  "scripts": {
    "typecheck": "pnpm -r exec tsgo --noEmit",
    "test": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:smoke": "vitest run --project smoke",
    "check": "pnpm run typecheck && pnpm run test",
    "verify": "pnpm run check && pnpm run test:integration && pnpm run test:smoke"
  }
}
```

### Vitest 项目配置

使用 `vitest.config.ts` 中的 `test.projects` 分离三层测试：

| 项目 | 匹配范围 | 说明 |
|------|----------|------|
| `unit` | `packages/**/__tests__/**/*.test.ts` | 包内单元测试 |
| `integration` | `tests/integration/**/*.test.ts` | 跨包集成测试（纯内存，无外部依赖） |
| `smoke` | `tests/smoke/**/*.test.ts` | 冒烟测试（端到端 + 导出完整性） |

集成和冒烟项目通过 `resolve.alias` 映射 `@rag-sdk/*` 到包源码。

### 开发流水线

完成功能包或重大修改后，依次执行：

1. `tsgo` 类型检查
2. 单元测试
3. 本地 Demo 运行
4. 全局冒烟测试

### 禁止事项

- 禁止缺失 Demo 或测试用例
- 严禁仅依赖手动运行验证逻辑
- 禁止在 `runtime` 内部编写 BLEU/MRR 等评测指标（应归入 `eval` 包）

### 职责界定

- **验证体系**：负责代码正确性与系统可运行性
- **评测体系**：负责衡量 RAG 生成效果的优劣（归 `eval` 包组）

## 原因

1. **统一工具链**：TypeScript + Vitest + Zod + tsx 四件套覆盖了从静态到动态的全部验证需求，避免引入过多工具增加维护负担
2. **逐层递进**：Type 检查在编译期捕获错误，Spec 校验在运行时捕获数据问题，单元测试验证逻辑，Demo 确认可运行，集成测试保证协同
3. **独立自治**：每个包有 `__tests__/` 和 `demo/`，可独立验证，不依赖全局环境
4. **AI 友好**：Demo 是最小可运行示例，AI 生成的代码必须能跑通 Demo 才算验收通过
5. **防止回归**：冒烟测试覆盖 RAG 最小闭环路径（Query → Answer），任何修改都不会破坏核心流程

## 后果

- 每个包需额外维护 `__tests__/` 和 `demo/` 目录
- 开发流水线变长：类型检查 → 测试 → Demo → 冒烟，四步缺一不可
- `runtime` 包不得自行实现评测指标，需通过 `eval` 包组满足
- 根目录 `package.json` 需新增 `typecheck`、`test`、`check`、`smoke`、`verify` 五个脚本
