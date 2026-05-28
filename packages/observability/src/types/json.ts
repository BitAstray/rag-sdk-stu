import type { JsonValue, JsonObject } from "@rag-sdk/core"

/**
 * RAG 属性类型，复用 core 的 JsonValue 语义
 * 约定：attributes 应尽量扁平，但允许嵌套结构
 */
export type RAGAttributes = Record<string, JsonValue>

export type { JsonValue, JsonObject }
