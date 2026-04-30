# SDK 使用指南

```bash
pnpm install                # 安装依赖
pnpm typecheck              # 类型检查（tsgo --noEmit）
pnpm test                   # 单元测试（--project unit）
pnpm test:integration       # 集成测试（--project integration）
pnpm test:smoke             # 冒烟测试（--project smoke）
pnpm check                  # typecheck + test
pnpm verify                 # check + integration + smoke（完整验证）
```

详见 [ADR-002: 验证体系设计](../decisions/ADR-002-verification-system.md)。
