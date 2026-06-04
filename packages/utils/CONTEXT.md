# Utils

通用工具层，提供时间戳、ID 生成、安全 JSON 序列化等基础函数。

**当前状态**：已实现基础工具函数。Logger 和 Config 待实现。

## Language

**createTimestamp**:
ISO 8601 时间戳字符串工厂。
_Avoid_: now, currentDate

**createId**:
唯一 ID 生成器，支持可配置前缀。默认前缀为 "id"。
_Avoid_: generateId, uuid

**createTraceId**:
便捷别名，创建 trace 前缀的 ID。
_Avoid_: traceId

**safeStringify**:
JSON.stringify 包装器，优雅处理循环引用。
_Avoid_: toJSON, serialize

**toSerializable**:
将复杂值（Date、Error、functions）转换为 JSON 安全的表示。
_Avoid_: sanitize, normalize

## Relationships

- **Utils** 是叶子依赖层 — 不依赖任何其他 `@rag-sdk` 包
- **Observability**、**Runtime**、**Indexing** 依赖 Utils 获取时间戳和 ID 生成
- Utils 提供 re-export 的便捷别名（`createTraceId`）以保持向后兼容
- Logger 和 Config 是未来的能力（待实现）

## Implementation Status

- [x] 时间戳创建（`createTimestamp`）
- [x] ID 生成（`createId`、`createTraceId`）
- [x] 安全 JSON 序列化（`safeStringify`、`toSerializable`）
- [ ] Logger 接口和实现
- [ ] Config 接口和实现

## Example dialogue

> **Dev:** "用 **createTimestamp** 记录事件时间，用 **createId** 生成追踪 ID。"
> **Domain expert:** "对，**Utils** 提供基础能力，具体业务逻辑不在这里。"

> **Dev:** "Utils 包现在能用吗？"
> **Domain expert:** "Utils 包现在提供了时间戳、ID 生成和安全 JSON 序列化。Logger 和 Config 还在规划中。"
