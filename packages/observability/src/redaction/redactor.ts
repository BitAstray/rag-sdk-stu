import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import type { RedactionOptions } from "../types/redaction.js"
import { parseFieldPath, matchesFieldPath } from "./field-path.js"

/**
 * Redaction Middleware
 *
 * 位于 Observer 和 Exporter 之间，负责字段脱敏和内容截断
 * 支持点路径和正则表达式
 */
export interface RedactionMiddleware {
  redactEvent(event: RAGEvent): RAGEvent
  redactError(error: RAGErrorRecord): RAGErrorRecord
  redactTrace(trace: RAGTrace): RAGTrace
}

/**
 * 内容字段关键词
 */
const CONTENT_FIELD_KEYWORDS = [
  "query",
  "content",
  "prompt",
  "answer",
  "context",
  "text",
]

function isContentField(key: string): boolean {
  const lower = key.toLowerCase()
  return CONTENT_FIELD_KEYWORDS.some((f) => lower.includes(f))
}

/**
 * 创建 Redaction Middleware
 */
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
        return value.length > contentPreviewLength
          ? value.substring(0, contentPreviewLength) + "..."
          : value
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
