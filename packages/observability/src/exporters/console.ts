import type { TraceExporter } from "../types/exporter.js"

export interface ConsoleExporterOptions {
  level?: "debug" | "info" | "warn" | "error"
}

/**
 * Console Exporter
 *
 * 用于 createRAGObserver({ exporters: [createConsoleExporter()] })
 */
export function createConsoleExporter(
  options: ConsoleExporterOptions = {}
): TraceExporter {
  const { level = "info" } = options

  const levels = ["debug", "info", "warn", "error"]
  const minLevel = levels.indexOf(level)

  const shouldLog = (eventLevel: string): boolean => {
    return levels.indexOf(eventLevel) >= minLevel
  }

  return {
    export(trace) {
      if (!shouldLog("info")) return

      console.log(`[exporter] trace exported`, {
        traceId: trace.traceId,
        scope: trace.scope,
        status: trace.status,
        durationMs: trace.durationMs,
        eventCount: trace.events.length,
        errorCount: trace.errors?.length ?? 0,
      })
    },
  }
}
