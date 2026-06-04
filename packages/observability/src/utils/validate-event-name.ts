import type { RAGEventName, RAGEventScope, RAGEventAction } from "../types/events.js"

const VALID_SCOPES: RAGEventScope[] = ["runtime", "indexing"]
const VALID_ACTIONS: RAGEventAction[] = [
  "receive",
  "preprocess",
  "start",
  "complete",
  "fail",
  "select",
  "drop",
  "store",
]

/**
 * 事件名格式：<scope>.<stage>.<action>
 * - scope: runtime | indexing
 * - stage: 小写字母和下划线
 * - action: 预定义的动作集合
 */
const EVENT_NAME_PATTERN = /^(runtime|indexing)\.[a-z][a-z_]*\.[a-z]+$/

export function isValidEventName(name: string): name is RAGEventName {
  if (!EVENT_NAME_PATTERN.test(name)) {
    return false
  }

  const parts = name.split(".")
  const scope = parts[0] as RAGEventScope
  const action = parts[2] as RAGEventAction

  return VALID_SCOPES.includes(scope) && VALID_ACTIONS.includes(action)
}

export function validateEventName(name: string): { valid: boolean; warning?: string } {
  if (!EVENT_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      warning: `Invalid event name format: "${name}". Expected format: <scope>.<stage>.<action>`,
    }
  }

  const parts = name.split(".")
  const scope = parts[0] as RAGEventScope
  const action = parts[2] as RAGEventAction

  if (!VALID_SCOPES.includes(scope)) {
    return {
      valid: false,
      warning: `Invalid scope "${scope}" in event name "${name}". Must be one of: ${VALID_SCOPES.join(", ")}`,
    }
  }

  if (!VALID_ACTIONS.includes(action)) {
    return {
      valid: false,
      warning: `Invalid action "${action}" in event name "${name}". Must be one of: ${VALID_ACTIONS.join(", ")}`,
    }
  }

  return { valid: true }
}
