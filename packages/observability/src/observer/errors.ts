import type { RAGObserver } from "../types/observer.js"

/**
 * Observer 错误回调
 */
export interface ObserverErrorCallback {
  (error: Error, context: { method: string; observer: RAGObserver }): void
}

/**
 * 为 Observer 添加错误隔离
 *
 * observer 方法失败不应中断主流程
 * 异步方法采用 fire-and-forget 模式
 */
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
