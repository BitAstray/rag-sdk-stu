# Observability 包代码编写计划

## 概述

根据设计文档和确认的设计决策，制定 `@rag-sdk/observability` 包的代码编写计划。

## 已确认的设计决策

| 编号 | 问题 | 决策 |
|------|------|------|
| 1 | RAGObserver 与 Hook 的关系 | 独立共存，Hook 用于管线扩展，Observer 用于观测 |
| 2 | RAGEvent 的 name 和 stage 字段 | 保留两个字段，stage 用于快速过滤，name 用于精确匹配 |
| 3 | TraceContext 和 RAGTrace 的关系 | TraceContext 是创建时输入，RAGTrace 是最终输出，字段重复是刻意的 |
| 4 | Observer 的错误隔离 | 吞掉错误，通过 `onObserverError` 回调通知调用方 |
| 5 | Observer 的生命周期管理 | `flush()` 由 runtime/indexing 自动调用，`shutdown()` 由调用方负责 |
| 6 | Redaction 的执行位置 | Observer → RedactionMiddleware → Exporter |
| 7 | Sampling 的执行位置 | 先采样再脱敏，未被采样的 trace 直接丢弃 |
| 8 | createConsoleObserver 和 createRAGObserver 的关系 | 独立实现，createConsoleObserver 不经过 Exporter 抽象 |
| 9 | RAGAttributes 的类型 | 使用 JsonValue，约定 attributes 应尽量扁平 |
| 10 | Event 命名规则的校验 | 始终校验，格式不正确时记录 warning |
| 11 | Observer 方法的异步支持 | fire-and-forget，不阻塞主流程 |
| 12 | Trace 的生命周期管理 | Observer 内部管理，接收到第一个事件时创建 Trace，接收到 run.complete 或 run.fail 事件时结束 Trace |
| 13 | Redaction 的字段路径语法 | 支持正则表达式 |

## 前置依赖

### JsonValue 类型问题

当前 core 包的 `MetadataValue` 类型较窄，不支持嵌套结构：

```TypeScript
// 当前 core/src/spec/metadata.ts
export const MetadataValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
])
```

设计文档要求 observability 的 attributes 使用更宽的 `JsonValue` 类型：

```TypeScript
export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }
```

**建议**：在 core 包中添加 `JsonValue` 类型定义，供 observability 和其他包复用。

**决策点**：需要确认是否在本次计划中包含 core 包的改动，还是在 observability 包内部临时定义 JsonValue 类型。

---

## Phase 1: 协议草案与本地观测

### 目标

建立 observability 包的基础协议和最小本地观测能力。

### 范围

1. 类型定义
2. Observer 接口
3. NoopObserver
4. createConsoleObserver
5. 内部错误隔离

### 文件结构

```
packages/observability/
  src/
    index.ts                    # 公开导出
    types/
      index.ts                  # 类型导出
      json.ts                   # JsonValue 类型（如果 core 未提供）
      attributes.ts             # RAGAttributes 类型
      events.ts                 # RAGEventName, RuntimeEventName, IndexingEventName
      trace.ts                  # TraceContext, RAGTrace
      event.ts                  # RAGEvent
      metric.ts                 # RAGMetric
      error.ts                  # RAGErrorRecord
      observer.ts               # RAGObserver 接口
      exporter.ts               # TraceExporter 接口
      redaction.ts              # RedactionOptions
      sampling.ts               # SamplingOptions
    observer/
      index.ts                  # Observer 导出
      noop.ts                   # NoopObserver
      console.ts                # createConsoleObserver
      composite.ts              # CompositeObserver（内部使用）
      errors.ts                 # Observer 内部错误隔离
    utils/
      index.ts                  # Utils 导出
      timestamp.ts              # ISO 时间戳生成
      id.ts                     # traceId 生成
      validate-event-name.ts    # 事件名校验
      safe-json.ts              # 安全 JSON 序列化
    errors/
      index.ts                  # 错误导出
      base.ts                   # ObservabilityError 基类
```

### 详细任务

#### 1.1 添加 core 包的 JsonValue 类型

**文件**: `packages/core/src/spec/json.ts`

```TypeScript
export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }
```

**文件**: `packages/core/src/index.ts`（添加导出）

```TypeScript
export type { JsonPrimitive, JsonValue, JsonObject } from "./spec/json.js"
```

**文件**: `packages/core/package.json`（添加依赖 zod，如果需要）

#### 1.2 类型定义

**文件**: `packages/observability/src/types/attributes.ts`

```TypeScript
import type { JsonValue } from "@rag-sdk/core"

export type RAGAttributes = Record<string, JsonValue>
```

**文件**: `packages/observability/src/types/events.ts`

```TypeScript
export type RAGEventScope = "runtime" | "indexing"

export type RAGEventAction =
  | "receive"
  | "preprocess"
  | "start"
  | "complete"
  | "fail"
  | "select"
  | "drop"
  | "store"

export type RuntimeEventName =
  | "runtime.query.receive"
  | "runtime.query.preprocess"
  | "runtime.retrieval.start"
  | "runtime.retrieval.complete"
  | "runtime.retrieval.fail"
  | "runtime.post_retrieval.start"
  | "runtime.post_retrieval.select"
  | "runtime.post_retrieval.fail"
  | "runtime.generation.start"
  | "runtime.generation.complete"
  | "runtime.generation.fail"
  | "runtime.run.complete"
  | "runtime.run.fail"

export type IndexingEventName =
  | "indexing.run.start"
  | "indexing.run.complete"
  | "indexing.run.fail"
  | "indexing.load.start"
  | "indexing.load.complete"
  | "indexing.load.fail"
  | "indexing.transform.complete"
  | "indexing.filter.complete"
  | "indexing.chunk.complete"
  | "indexing.transform_chunk.complete"
  | "indexing.metadata.complete"
  | "indexing.extract_metadata.complete"
  | "indexing.filter_chunk.complete"
  | "indexing.embed.complete"
  | "indexing.store.complete"

export type RAGEventName = RuntimeEventName | IndexingEventName
```

**文件**: `packages/observability/src/types/trace.ts`

```TypeScript
export interface TraceContext {
  traceId: string
  traceIdSource?: "generated" | "provided" | "requestId"
  requestId?: string
  serviceName?: string
  environment?: string
  sampleId?: string
  dataset?: string
  version?: string
  tags?: Record<string, string | number | boolean>
}

export interface RAGTrace {
  traceId: string
  traceIdSource?: "generated" | "provided" | "requestId"
  requestId?: string
  scope: "runtime" | "indexing"
  serviceName?: string
  environment?: string
  sampleId?: string
  dataset?: string
  version?: string
  startedAt: string
  endedAt?: string
  durationMs?: number
  status: "ok" | "error"
  tags?: Record<string, string | number | boolean>
  events: RAGEvent[]
  errors?: RAGErrorRecord[]
  metrics?: RAGMetric[]
}
```

**文件**: `packages/observability/src/types/event.ts`

```TypeScript
import type { RAGEventName } from "./events.js"
import type { RAGAttributes } from "./attributes.js"

export interface RAGEvent {
  traceId: string
  scope: "runtime" | "indexing"
  stage: string
  name: RAGEventName
  timestamp: string
  durationMs?: number
  attributes?: RAGAttributes
}
```

**文件**: `packages/observability/src/types/metric.ts`

```TypeScript
import type { RAGAttributes } from "./attributes.js"

export interface RAGMetric {
  traceId: string
  name: string
  value: number
  unit?: "ms" | "count" | "tokens" | "ratio" | "bytes"
  scope?: "runtime" | "indexing"
  stage?: string
  attributes?: RAGAttributes
}
```

**文件**: `packages/observability/src/types/error.ts`

```TypeScript
import type { RAGEventName } from "./events.js"
import type { RAGAttributes } from "./attributes.js"

export interface RAGErrorRecord {
  traceId: string
  scope: "runtime" | "indexing"
  stage: string
  name: RAGEventName
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  attributes?: RAGAttributes
}
```

**文件**: `packages/observability/src/types/observer.ts`

```TypeScript
import type { RAGEvent } from "./event.js"
import type { RAGErrorRecord } from "./error.js"
import type { RAGTrace } from "./trace.js"

export interface RAGObserver {
  onEvent?(event: RAGEvent): void | Promise<void>
  onError?(error: RAGErrorRecord): void | Promise<void>
  onTraceEnd?(trace: RAGTrace): void | Promise<void>
  flush?(): void | Promise<void>
  shutdown?(): void | Promise<void>
}
```

**文件**: `packages/observability/src/types/exporter.ts`

```TypeScript
import type { RAGTrace } from "./trace.js"

export interface TraceExporter {
  export(trace: RAGTrace): void | Promise<void>
  flush?(): void | Promise<void>
  shutdown?(): void | Promise<void>
}
```

**文件**: `packages/observability/src/types/redaction.ts`

```TypeScript
export interface RedactionOptions {
  fields?: string[]
  maskContent?: boolean
  contentPreviewLength?: number
  replacement?: string
}
```

**文件**: `packages/observability/src/types/sampling.ts`

```TypeScript
export interface SamplingOptions {
  rate?: number
  alwaysSampleOnError?: boolean
}
```

**文件**: `packages/observability/src/types/index.ts`

```TypeScript
export * from "./attributes.js"
export * from "./events.js"
export * from "./trace.js"
export * from "./event.js"
export * from "./metric.js"
export * from "./error.js"
export * from "./observer.js"
export * from "./exporter.js"
export * from "./redaction.js"
export * from "./sampling.js"
```

#### 1.3 Utils 工具函数

**文件**: `packages/observability/src/utils/timestamp.ts`

```TypeScript
export function createTimestamp(): string {
  return new Date().toISOString()
}
```

**文件**: `packages/observability/src/utils/id.ts`

```TypeScript
export function createTraceId(): string {
  // 使用 crypto.randomUUID() 或简单实现
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
```

**文件**: `packages/observability/src/utils/validate-event-name.ts`

```TypeScript
import type { RAGEventName } from "../types/events.js"

const EVENT_NAME_PATTERN = /^(runtime|indexing)\.[a-z_]+\.[a-z_]+$/

export function isValidEventName(name: string): name is RAGEventName {
  return EVENT_NAME_PATTERN.test(name)
}

export function validateEventName(name: string): { valid: boolean; warning?: string } {
  if (!EVENT_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      warning: `Invalid event name format: "${name}". Expected format: <scope>.<stage>.<action>`,
    }
  }
  return { valid: true }
}
```

**文件**: `packages/observability/src/utils/safe-json.ts`

```TypeScript
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function toSerializable(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }
  if (typeof value === "function") {
    return undefined
  }
  return value
}
```

**文件**: `packages/observability/src/utils/index.ts`

```TypeScript
export * from "./timestamp.js"
export * from "./id.js"
export * from "./validate-event-name.js"
export * from "./safe-json.js"
```

#### 1.4 错误定义

**文件**: `packages/observability/src/errors/base.ts`

```TypeScript
export class ObservabilityError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = "ObservabilityError"
  }
}
```

**文件**: `packages/observability/src/errors/index.ts`

```TypeScript
export { ObservabilityError } from "./base.js"
```

#### 1.5 Observer 实现

**文件**: `packages/observability/src/observer/noop.ts`

```TypeScript
import type { RAGObserver } from "../types/observer.js"

export function createNoopObserver(): RAGObserver {
  return {}
}
```

**文件**: `packages/observability/src/observer/console.ts`

```TypeScript
import type { RAGObserver } from "../types/observer.js"
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import { validateEventName } from "../utils/validate-event-name.js"
import { safeStringify } from "../utils/safe-json.js"

export interface ConsoleObserverOptions {
  level?: "debug" | "info" | "warn" | "error"
  colorize?: boolean
}

export function createConsoleObserver(options: ConsoleObserverOptions = {}): RAGObserver {
  const { level = "info" } = options

  const shouldLog = (eventLevel: string): boolean => {
    const levels = ["debug", "info", "warn", "error"]
    return levels.indexOf(eventLevel) >= levels.indexOf(level)
  }

  return {
    onEvent(event: RAGEvent) {
      if (!shouldLog("info")) return

      // 校验事件名
      const validation = validateEventName(event.name)
      if (!validation.valid) {
        console.warn(`[observability] ${validation.warning}`)
      }

      console.log(`[observability] ${event.name}`, {
        traceId: event.traceId,
        stage: event.stage,
        timestamp: event.timestamp,
        durationMs: event.durationMs,
        attributes: event.attributes,
      })
    },

    onError(error: RAGErrorRecord) {
      if (!shouldLog("error")) return

      console.error(`[observability] ${error.name}`, {
        traceId: error.traceId,
        stage: error.stage,
        error: error.error,
        attributes: error.attributes,
      })
    },

    onTraceEnd(trace: RAGTrace) {
      if (!shouldLog("info")) return

      console.log(`[observability] trace completed`, {
        traceId: trace.traceId,
        scope: trace.scope,
        status: trace.status,
        durationMs: trace.durationMs,
        eventCount: trace.events.length,
        errorCount: trace.errors?.length ?? 0,
      })
    },

    flush() {
      // Console observer 无需 flush
    },

    shutdown() {
      // Console observer 无需 shutdown
    },
  }
}
```

**文件**: `packages/observability/src/observer/errors.ts`

```TypeScript
import type { RAGObserver } from "../types/observer.js"

export interface ObserverErrorCallback {
  (error: Error, context: { method: string; observer: RAGObserver }): void
}

export function wrapObserverWithErrorHandling(
  observer: RAGObserver,
  onError?: ObserverErrorCallback
): RAGObserver {
  const safeCall = <T extends (...args: any[]) => any>(
    method: string,
    fn: T,
    ...args: Parameters<T>
  ): void => {
    try {
      const result = fn(...args)
      // fire-and-forget，不等待 Promise
      if (result instanceof Promise) {
        result.catch((err) => {
          onError?.(err, { method, observer })
        })
      }
    } catch (err) {
      onError?.(err as Error, { method, observer })
    }
  }

  return {
    onEvent: observer.onEvent
      ? (event) => safeCall("onEvent", observer.onEvent!, event)
      : undefined,
    onError: observer.onError
      ? (error) => safeCall("onError", observer.onError!, error)
      : undefined,
    onTraceEnd: observer.onTraceEnd
      ? (trace) => safeCall("onTraceEnd", observer.onTraceEnd!, trace)
      : undefined,
    flush: observer.flush
      ? () => safeCall("flush", observer.flush!)
      : undefined,
    shutdown: observer.shutdown
      ? () => safeCall("shutdown", observer.shutdown!)
      : undefined,
  }
}
```

**文件**: `packages/observability/src/observer/composite.ts`

```TypeScript
import type { RAGObserver } from "../types/observer.js"

export function createCompositeObserver(observers: RAGObserver[]): RAGObserver {
  return {
    onEvent(event) {
      for (const observer of observers) {
        observer.onEvent?.(event)
      }
    },
    onError(error) {
      for (const observer of observers) {
        observer.onError?.(error)
      }
    },
    onTraceEnd(trace) {
      for (const observer of observers) {
        observer.onTraceEnd?.(trace)
      }
    },
    async flush() {
      await Promise.all(observers.map((o) => o.flush?.()))
    },
    async shutdown() {
      await Promise.all(observers.map((o) => o.shutdown?.()))
    },
  }
}
```

**文件**: `packages/observability/src/observer/index.ts`

```TypeScript
export { createNoopObserver } from "./noop.js"
export { createConsoleObserver } from "./console.js"
export type { ConsoleObserverOptions } from "./console.js"
export { createCompositeObserver } from "./composite.js"
export { wrapObserverWithErrorHandling } from "./errors.js"
export type { ObserverErrorCallback } from "./errors.js"
```

#### 1.6 公开导出

**文件**: `packages/observability/src/index.ts`

```TypeScript
// Types
export * from "./types/index.js"

// Observers
export * from "./observer/index.js"

// Utils
export * from "./utils/index.js"

// Errors
export * from "./errors/index.js"
```

#### 1.7 更新 package.json

**文件**: `packages/observability/package.json`

```json
{
  "name": "@rag-sdk/observability",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "dependencies": {
    "@rag-sdk/core": "workspace:*"
  },
  "devDependencies": {},
  "scripts": {}
}
```

---

## Phase 2: Redaction 与 Sampling

### 目标

实现数据脱敏和采样能力。

### 文件结构

```
packages/observability/
  src/
    redaction/
      index.ts
      redactor.ts          # RedactionMiddleware 实现
      field-path.ts        # 字段路径解析（支持正则）
    sampling/
      index.ts
      sampler.ts           # SamplingMiddleware 实现
```

### 详细任务

#### 2.1 Redaction 实现

**文件**: `packages/observability/src/redaction/field-path.ts`

```TypeScript
export interface FieldPathPattern {
  type: "exact" | "regex"
  pattern: string | RegExp
}

export function parseFieldPath(path: string): FieldPathPattern {
  // 检查是否包含正则表达式元字符
  if (/[\[\]{}()+*?^$|\\]/.test(path)) {
    return { type: "regex", pattern: new RegExp(path) }
  }
  return { type: "exact", pattern: path }
}

export function matchesFieldPath(
  objectPath: string,
  patterns: FieldPathPattern[]
): boolean {
  return patterns.some((p) => {
    if (p.type === "exact") {
      return objectPath === p.pattern
    }
    return (p.pattern as RegExp).test(objectPath)
  })
}

export function setValueByPath(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const parts = path.split(".")
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] === undefined) {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}
```

**文件**: `packages/observability/src/redaction/redactor.ts`

```TypeScript
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import type { RedactionOptions } from "../types/redaction.js"
import { parseFieldPath, matchesFieldPath } from "./field-path.js"

export interface RedactionMiddleware {
  redactEvent(event: RAGEvent): RAGEvent
  redactError(error: RAGErrorRecord): RAGErrorRecord
  redactTrace(trace: RAGTrace): RAGTrace
}

export function createRedactionMiddleware(
  options: RedactionOptions = {}
): RedactionMiddleware {
  const {
    fields = [],
    maskContent = true,
    contentPreviewLength = 200,
    replacement = "[REDACTED]",
  } = options

  const fieldPatterns = fields.map(parseFieldPath)

  const redactValue = (key: string, value: unknown): unknown => {
    // 检查是否匹配脱敏字段
    if (matchesFieldPath(key, fieldPatterns)) {
      return replacement
    }

    // 检查是否是内容字段
    if (maskContent && isContentField(key)) {
      if (typeof value === "string") {
        return value.substring(0, contentPreviewLength) + "..."
      }
    }

    return value
  }

  const redactAttributes = (
    attributes: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined => {
    if (!attributes) return attributes
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(attributes)) {
      result[key] = redactValue(key, value)
    }
    return result
  }

  return {
    redactEvent(event: RAGEvent): RAGEvent {
      return {
        ...event,
        attributes: redactAttributes(event.attributes) as any,
      }
    },

    redactError(error: RAGErrorRecord): RAGErrorRecord {
      return {
        ...error,
        attributes: redactAttributes(error.attributes) as any,
      }
    },

    redactTrace(trace: RAGTrace): RAGTrace {
      return {
        ...trace,
        events: trace.events.map((e) => this.redactEvent(e)),
        errors: trace.errors?.map((e) => this.redactError(e)),
      }
    },
  }
}

function isContentField(key: string): boolean {
  const contentFields = [
    "query",
    "content",
    "prompt",
    "answer",
    "context",
    "text",
  ]
  return contentFields.some((f) => key.toLowerCase().includes(f))
}
```

**文件**: `packages/observability/src/redaction/index.ts`

```TypeScript
export { createRedactionMiddleware } from "./redactor.js"
export type { RedactionMiddleware } from "./redactor.js"
export { parseFieldPath, matchesFieldPath } from "./field-path.js"
```

#### 2.2 Sampling 实现

**文件**: `packages/observability/src/sampling/sampler.ts`

```TypeScript
import type { SamplingOptions } from "../types/sampling.js"

export interface SamplingMiddleware {
  shouldSample(isError: boolean): boolean
}

export function createSamplingMiddleware(
  options: SamplingOptions = {}
): SamplingMiddleware {
  const { rate = 1, alwaysSampleOnError = true } = options

  return {
    shouldSample(isError: boolean): boolean {
      // 错误 trace 始终采样
      if (isError && alwaysSampleOnError) {
        return true
      }

      // 按 rate 采样
      return Math.random() < rate
    },
  }
}
```

**文件**: `packages/observability/src/sampling/index.ts`

```TypeScript
export { createSamplingMiddleware } from "./sampler.js"
export type { SamplingMiddleware } from "./sampler.js"
```

---

## Phase 3: createRAGObserver 组合

### 目标

实现 `createRAGObserver`，组合 Observer、Redaction、Sampling 和 Exporter。

### 文件结构

```
packages/observability/
  src/
    observer/
      rag-observer.ts      # createRAGObserver 实现
    exporters/
      index.ts
      console.ts           # createConsoleExporter
      memory.ts            # createMemoryTraceExporter
      jsonl.ts             # createJSONLTraceExporter（可选）
```

### 详细任务

#### 3.1 Exporter 实现

**文件**: `packages/observability/src/exporters/console.ts`

```TypeScript
import type { TraceExporter } from "../types/exporter.js"
import { safeStringify } from "../utils/safe-json.js"

export interface ConsoleExporterOptions {
  level?: "debug" | "info" | "warn" | "error"
}

export function createConsoleExporter(
  options: ConsoleExporterOptions = {}
): TraceExporter {
  const { level = "info" } = options

  return {
    export(trace) {
      if (level === "debug" || level === "info") {
        console.log(`[exporter] trace exported`, {
          traceId: trace.traceId,
          scope: trace.scope,
          status: trace.status,
          durationMs: trace.durationMs,
          eventCount: trace.events.length,
        })
      }
    },
  }
}
```

**文件**: `packages/observability/src/exporters/memory.ts`

```TypeScript
import type { TraceExporter } from "../types/exporter.js"
import type { RAGTrace } from "../types/trace.js"

export function createMemoryTraceExporter(): TraceExporter & {
  getTraces(): RAGTrace[]
  clear(): void
} {
  const traces: RAGTrace[] = []

  return {
    export(trace) {
      traces.push(trace)
    },
    getTraces() {
      return [...traces]
    },
    clear() {
      traces.length = 0
    },
  }
}
```

**文件**: `packages/observability/src/exporters/index.ts`

```TypeScript
export { createConsoleExporter } from "./console.js"
export type { ConsoleExporterOptions } from "./console.js"
export { createMemoryTraceExporter } from "./memory.js"
```

#### 3.2 createRAGObserver 实现

**文件**: `packages/observability/src/observer/rag-observer.ts`

```TypeScript
import type { RAGObserver } from "../types/observer.js"
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import type { TraceExporter } from "../types/exporter.js"
import type { RedactionOptions } from "../types/redaction.js"
import type { SamplingOptions } from "../types/sampling.js"
import { createRedactionMiddleware } from "../redaction/redactor.js"
import { createSamplingMiddleware } from "../sampling/sampler.js"
import { createTimestamp } from "../utils/timestamp.js"
import { createTraceId } from "../utils/id.js"
import { validateEventName } from "../utils/validate-event-name.js"
import type { ObserverErrorCallback } from "./errors.js"

export interface RAGObserverOptions {
  exporters?: TraceExporter[]
  redact?: RedactionOptions
  sampling?: SamplingOptions
  onError?: ObserverErrorCallback
}

interface TraceState {
  traceId: string
  scope: "runtime" | "indexing"
  startedAt: string
  events: RAGEvent[]
  errors: RAGErrorRecord[]
  status: "ok" | "error"
}

export function createRAGObserver(options: RAGObserverOptions = {}): RAGObserver {
  const {
    exporters = [],
    redact = {},
    sampling = {},
    onError,
  } = options

  const redactor = createRedactionMiddleware(redact)
  const sampler = createSamplingMiddleware(sampling)

  // 活跃的 trace 状态
  const activeTraces = new Map<string, TraceState>()

  const safeCall = <T extends (...args: any[]) => any>(
    method: string,
    fn: T,
    ...args: Parameters<T>
  ): void => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        result.catch((err) => {
          onError?.(err, { method, observer: ragObserver })
        })
      }
    } catch (err) {
      onError?.(err as Error, { method, observer: ragObserver })
    }
  }

  const exportTrace = (trace: RAGTrace): void => {
    // 采样决策
    const isError = trace.status === "error"
    if (!sampler.shouldSample(isError)) {
      return
    }

    // Redaction
    const redactedTrace = redactor.redactTrace(trace)

    // 导出到所有 exporters
    for (const exporter of exporters) {
      safeCall("exporter.export", exporter.export.bind(exporter), redactedTrace)
    }
  }

  const ragObserver: RAGObserver = {
    onEvent(event: RAGEvent) {
      // 校验事件名
      const validation = validateEventName(event.name)
      if (!validation.valid) {
        console.warn(`[observability] ${validation.warning}`)
      }

      // 获取或创建 trace 状态
      let state = activeTraces.get(event.traceId)
      if (!state) {
        state = {
          traceId: event.traceId,
          scope: event.scope,
          startedAt: event.timestamp,
          events: [],
          errors: [],
          status: "ok",
        }
        activeTraces.set(event.traceId, state)
      }

      // 添加事件
      state.events.push(event)

      // 检查是否是结束事件
      if (event.name.endsWith(".complete") || event.name.endsWith(".fail")) {
        if (event.name.endsWith(".fail")) {
          state.status = "error"
        }
      }
    },

    onError(error: RAGErrorRecord) {
      let state = activeTraces.get(error.traceId)
      if (!state) {
        state = {
          traceId: error.traceId,
          scope: error.scope,
          startedAt: error.timestamp,
          events: [],
          errors: [],
          status: "error",
        }
        activeTraces.set(error.traceId, state)
      }

      state.errors.push(error)
      state.status = "error"
    },

    onTraceEnd(trace: RAGTrace) {
      // 使用传入的 trace 数据
      exportTrace(trace)

      // 清理活跃 trace 状态
      activeTraces.delete(trace.traceId)
    },

    async flush() {
      await Promise.all(exporters.map((e) => e.flush?.()))
    },

    async shutdown() {
      // 导出所有未完成的 trace
      for (const [traceId, state] of activeTraces) {
        const trace: RAGTrace = {
          traceId: state.traceId,
          scope: state.scope,
          startedAt: state.startedAt,
          endedAt: createTimestamp(),
          durationMs: Date.now() - new Date(state.startedAt).getTime(),
          status: state.status,
          events: state.events,
          errors: state.errors,
        }
        exportTrace(trace)
      }
      activeTraces.clear()

      await Promise.all(exporters.map((e) => e.shutdown?.()))
    },
  }

  return ragObserver
}
```

**文件**: `packages/observability/src/observer/index.ts`（更新）

```TypeScript
export { createNoopObserver } from "./noop.js"
export { createConsoleObserver } from "./console.js"
export type { ConsoleObserverOptions } from "./console.js"
export { createCompositeObserver } from "./composite.js"
export { wrapObserverWithErrorHandling } from "./errors.js"
export type { ObserverErrorCallback } from "./errors.js"
export { createRAGObserver } from "./rag-observer.js"
export type { RAGObserverOptions } from "./rag-observer.js"
```

#### 3.3 更新公开导出

**文件**: `packages/observability/src/index.ts`（更新）

```TypeScript
// Types
export * from "./types/index.js"

// Observers
export * from "./observer/index.js"

// Exporters
export * from "./exporters/index.js"

// Redaction
export * from "./redaction/index.js"

// Sampling
export * from "./sampling/index.js"

// Utils
export * from "./utils/index.js"

// Errors
export * from "./errors/index.js"
```

---

## Phase 4: 文档与测试

### 目标

更新文档和添加基础测试。

### 详细任务

#### 4.1 更新 CONTEXT.md

**文件**: `packages/observability/CONTEXT.md`

更新术语定义，添加 Observer、Exporter、Redaction、Sampling 等术语。

#### 4.2 更新 README.md

**文件**: `packages/observability/README.md`

添加使用示例和 API 文档。

#### 4.3 添加单元测试

**目录**: `packages/observability/__tests__/`

- `utils/validate-event-name.test.ts`
- `utils/safe-json.test.ts`
- `observer/console.test.ts`
- `observer/noop.test.ts`
- `redaction/redactor.test.ts`
- `sampling/sampler.test.ts`

---

## 实施顺序

1. **Phase 1.1**: 添加 core 包的 JsonValue 类型
2. **Phase 1.2-1.7**: 实现 observability 包的基础类型和 Observer
3. **Phase 2**: 实现 Redaction 和 Sampling
4. **Phase 3**: 实现 createRAGObserver 和 Exporter
5. **Phase 4**: 文档和测试

## 依赖关系

```
core (JsonValue)
  ↓
observability (types)
  ↓
observability (utils, errors)
  ↓
observability (observer, redaction, sampling)
  ↓
observability (createRAGObserver, exporters)
```

## 验证标准

- [ ] `tsgo` 类型检查通过
- [ ] 所有公开导出来自 `src/index.ts`
- [ ] createConsoleObserver 可用
- [ ] NoopObserver 可用
- [ ] observer 错误不会中断主流程
- [ ] 事件名格式校验正常工作
- [ ] Redaction 能脱敏指定字段
- [ ] Sampling 按 rate 采样
- [ ] 错误 trace 在 alwaysSampleOnError=true 时仍导出
