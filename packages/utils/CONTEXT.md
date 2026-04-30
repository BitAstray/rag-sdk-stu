# Utils

通用工具层，提供日志、配置和辅助函数。被所有其他包引用。

## Language

**Logger**:
统一的日志接口，支持不同日志级别和输出目标。
_Avoid_: console, log

**Config**:
配置管理，支持环境变量、配置文件和默认值。
_Avoid_: settings, options

## Relationships

- **Utils** 被所有其他包依赖，但不依赖任何其他包
- **Logger** 和 **Config** 是最常用的工具

## Example dialogue

> **Dev:** "用 **Logger** 记录 **Embedder** 的调用耗时，配置从 **Config** 读取。"
> **Domain expert:** "对，**Utils** 提供基础能力，具体业务逻辑不在这里。"
