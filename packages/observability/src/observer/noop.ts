import type { RAGObserver } from "../types/observer.js"

/**
 * Noop Observer
 *
 * 空实现，不执行任何操作
 */
export function createNoopObserver(): RAGObserver {
  return {}
}
