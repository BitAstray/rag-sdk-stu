import type { RAGObserver, TraceHandle } from "../types/observer.js"
import type { RAGEvent } from "../types/event.js"
import type { RAGErrorRecord } from "../types/error.js"
import type { RAGTrace } from "../types/trace.js"
import type { TraceExporter } from "../types/exporter.js"
import type { RedactionOptions } from "../types/redaction.js"
import type { SamplingOptions } from "../types/sampling.js"
import { createRedactionMiddleware } from "../redaction/redactor.js"
import { createSamplingMiddleware } from "../sampling/sampler.js"
import { createTimestamp } from "@rag-sdk/utils"
import { validateEventName } from "../utils/validate-event-name.js"
import type { ObserverErrorCallback } from "./errors.js"

export interface RAGObserverOptions {
  exporters?: TraceExporter[]
  redact?: RedactionOptions
  sampling?: SamplingOptions
  onError?: ObserverErrorCallback
}

/**
 * Trace 内部状态
 */
interface TraceState {
  traceId: string
  scope: string
  startedAt: string
  events: RAGEvent[]
  errors: RAGErrorRecord[]
  status: "ok" | "error"
  endedAt?: string
}

/**
 * 创建 RAG Observer
 *
 * 组合 Redaction、Sampling 与 Exporters
 * Observer 内部管理 Trace 生命周期：
 * - 接收到第一个事件时创建 Trace
 * - 通过显式的 startTrace 接口闭合生命周期
 */
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
      // fire-and-forget，不等待 Promise
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
      safeCall(
        "exporter.export",
        exporter.export.bind(exporter),
        redactedTrace
      )
    }
  }

  /**
   * 结束 trace 并导出
   */
  const finishTrace = (traceId: string, status: "ok" | "error"): void => {
    const state = activeTraces.get(traceId)
    if (!state) return

    state.endedAt = createTimestamp()
    state.status = status

    const trace: RAGTrace = {
      traceId: state.traceId,
      scope: state.scope as any,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      durationMs: new Date(state.endedAt).getTime() - new Date(state.startedAt).getTime(),
      status: state.status,
      events: state.events,
      errors: state.errors.length > 0 ? state.errors : undefined,
    }

    exportTrace(trace)
    activeTraces.delete(traceId)
  }

  const ragObserver: RAGObserver = {
    startTrace(traceId: string, scope: "runtime" | "indexing" | "eval"): TraceHandle {
      let state = activeTraces.get(traceId)
      if (!state) {
        state = {
          traceId,
          scope,
          startedAt: createTimestamp(),
          events: [],
          errors: [],
          status: "ok",
        }
        activeTraces.set(traceId, state)
      }

      return {
        end: (status: "ok" | "error") => {
          finishTrace(traceId, status)
        }
      }
    },

    onEvent(event: RAGEvent) {
      // 始终校验事件名
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
      // 使用传入的 trace 数据直接导出
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
        const now = createTimestamp()
        const trace: RAGTrace = {
          traceId: state.traceId,
          scope: state.scope as any,
          startedAt: state.startedAt,
          endedAt: now,
          durationMs: new Date(now).getTime() - new Date(state.startedAt).getTime(),
          status: state.status,
          events: state.events,
          errors: state.errors.length > 0 ? state.errors : undefined,
        }
        exportTrace(trace)
      }
      activeTraces.clear()

      await Promise.all(exporters.map((e) => e.shutdown?.()))
    },
  }

  return ragObserver
}