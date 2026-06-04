import type { Query } from "@rag-sdk/core"
import type { RAGObserver } from "@rag-sdk/observability"
import type { DAGNode, DAGExecutionResult } from "./dag.js"
import { executeDAG } from "./dag.js"

export interface RuntimeConfig {
  nodes: DAGNode[]
  observer?: RAGObserver
}

export interface RuntimeRunOptions {
  requestId?: string
  trace?: {
    traceId?: string
    tags?: Record<string, string | number | boolean>
  }
}

export interface Runtime {
  run(query: Query, options?: RuntimeRunOptions): Promise<DAGExecutionResult>
}

export function createRuntime(config: RuntimeConfig): Runtime {
  return {
    run: async (query: Query, options?: RuntimeRunOptions) => {
      return executeDAG(
        config.nodes,
        { query },
        {
          observer: config.observer,
          requestId: options?.requestId,
          traceId: options?.trace?.traceId,
          traceTags: options?.trace?.tags,
        }
      )
    }
  }
}
