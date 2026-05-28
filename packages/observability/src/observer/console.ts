import type { RAGObserver } from "../types/observer.js"
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import { validateEventName } from "../utils/validate-event-name.js"

export interface ConsoleObserverOptions {
  level?: "debug" | "info" | "warn" | "error"
}

/**
 * Console Observer
 *
 * 独立实现，不经过 Exporter 抽象
 * 最简单的接入方式，直接输出到 console
 */
export function createConsoleObserver(options: ConsoleObserverOptions = {}): RAGObserver {
  const { level = "info" } = options

  const levels = ["debug", "info", "warn", "error"]
  const minLevel = levels.indexOf(level)

  const shouldLog = (eventLevel: string): boolean => {
    return levels.indexOf(eventLevel) >= minLevel
  }

  return {
    onEvent(event: RAGEvent) {
      if (!shouldLog("info")) return

      // 始终校验事件名
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
