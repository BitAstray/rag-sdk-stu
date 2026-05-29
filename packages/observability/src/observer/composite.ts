import type { RAGObserver, TraceHandle } from "../types/observer.js"

/**
 * Composite Observer
 *
 * 组合多个 Observer，依次调用
 */
export function createCompositeObserver(observers: RAGObserver[]): RAGObserver {
  return {
    startTrace(traceId, scope) {
      const handles = observers
        .map(o => o.startTrace?.(traceId, scope))
        .filter((h): h is TraceHandle => h !== undefined)
      
      return {
        end: (status) => {
          for (const handle of handles) {
            handle.end(status)
          }
        }
      }
    },
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
