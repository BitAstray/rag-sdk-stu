import type { Query } from "@rag-sdk/core"
import type { DAGNode, DAGExecutionResult } from "./dag.js"
import { executeDAG } from "./dag.js"

export interface RuntimeConfig {
  nodes: DAGNode[]
}

export interface Runtime {
  run(query: Query): Promise<DAGExecutionResult>
}

export function createRuntime(config: RuntimeConfig): Runtime {
  return {
    run: async (query: Query) => {
      return executeDAG(config.nodes, { query })
    }
  }
}
