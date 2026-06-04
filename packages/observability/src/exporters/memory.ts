import type { TraceExporter } from "../types/exporter.js"
import type { RAGTrace } from "../types/trace.js"

/**
 * Memory Trace Exporter
 *
 * 用于本地断言与临时复盘
 */
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
