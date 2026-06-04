import type { RAGObserver } from "@rag-sdk/observability"
import { createId } from "@rag-sdk/utils"
import { createRuntimeEmitter } from "../observer/emit.js"

export interface DAGNode<Inputs = Record<string, any>, Output = any> {
  id: string
  dependencies: string[]
  execute: (inputs: Inputs) => Promise<Output> | Output
  telemetry?: {
    stage: string
    events: {
      start: string
      complete: string
      fail: string
    }
    extractMetrics?: (output: Output) => Record<string, unknown>
  }
}

/**
 * DAG 执行上下文
 *
 * 横切关注点（观测、追踪）通过这个显式类型化参数传入，
 * 而不是混在节点数据里。引擎据此发射事件、关联 trace。
 */
export interface ExecutionContext {
  observer?: RAGObserver
  requestId?: string
  traceId?: string
  traceTags?: Record<string, string | number | boolean>
}

export interface DAGExecutionResult {
  outputs: Record<string, any>
  durationMs: number
  traceId?: string
}

export async function executeDAG(
  nodes: DAGNode[],
  initialInputs: Record<string, any> = {},
  context: ExecutionContext = {}
): Promise<DAGExecutionResult> {
  const start = performance.now()
  const outputs: Record<string, any> = { ...initialInputs }
  const nodeMap = new Map<string, DAGNode>()

  const { observer, requestId, traceTags } = context

  // 生成 traceId
  const traceId = context.traceId || createId("trace")

  // 启动 trace 闭包
  const traceHandle = observer?.startTrace?.(traceId, "runtime")

  // 创建 runtime 发射器
  const emitter = createRuntimeEmitter(traceId, observer)

  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      throw new Error(`Duplicate node id in DAG: ${node.id}`)
    }
    nodeMap.set(node.id, node)
  }

  const promises = new Map<string, Promise<any>>()
  for (const key of Object.keys(initialInputs)) {
    promises.set(key, Promise.resolve(initialInputs[key]))
  }

  function runNode(id: string, visiting = new Set<string>()): Promise<any> {
    if (promises.has(id)) return promises.get(id)!
    if (visiting.has(id)) return Promise.reject(new Error(`Circular dependency detected: ${[...visiting, id].join(" -> ")}`))

    const node = nodeMap.get(id)
    if (!node) return Promise.reject(new Error(`Dependency '${id}' not found in DAG`))

    visiting.add(id)
    const depPromises = node.dependencies.map(depId => runNode(depId, new Set(visiting)))

    const promise = Promise.all(depPromises)
      .then(async (depResults) => {
        const inputs: Record<string, any> = {}
        for (let i = 0; i < node.dependencies.length; i++) {
          inputs[node.dependencies[i]] = depResults[i]
        }

        const stage = node.telemetry?.stage
        const events = node.telemetry?.events

        // 发射开始事件
        if (stage && events) {
          emitter.event(stage, events.start as any)
        }

        const startNode = performance.now()
        try {
          const output = await node.execute(inputs)
          const durationMs = performance.now() - startNode

          outputs[id] = {
            value: output,
            durationMs
          }

          // 发射完成事件
          if (stage && events) {
            emitter.event(stage, events.complete as any, {
              nodeId: id,
              ...(node.telemetry?.extractMetrics ? node.telemetry.extractMetrics(output) : {}),
            }, durationMs)
          }

          return output
        } catch (err) {
          const durationMs = performance.now() - startNode

          // 发射失败事件
          if (stage && events) {
            emitter.error(stage, events.fail as any, err as Error, {
              nodeId: id,
              durationMs,
            })
          }

          throw err
        }
      })
      .catch(err => {
        throw new Error(`Failed to execute node '${id}': ${err.message}`, { cause: err })
      })

    promises.set(id, promise)
    return promise
  }

  try {
    await Promise.all(nodes.map(n => runNode(n.id)))

    const durationMs = performance.now() - start

    // 发射 run.complete 事件
    emitter.event("run", "runtime.run.complete", {
      requestId,
      tags: traceTags,
      nodeCount: nodes.length,
    }, durationMs)

    traceHandle?.end("ok")

    return {
      outputs,
      durationMs,
      traceId,
    }
  } catch (err) {
    const durationMs = performance.now() - start

    // 发射 run.fail 事件
    emitter.error("run", "runtime.run.fail", err as Error, {
      requestId,
      tags: traceTags,
      durationMs,
    })

    traceHandle?.end("error")

    throw err
  }
}
