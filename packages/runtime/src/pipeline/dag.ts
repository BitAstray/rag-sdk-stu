export interface DAGNode<Inputs = Record<string, any>, Output = any> {
  id: string
  dependencies: string[]
  execute: (inputs: Inputs) => Promise<Output> | Output
}

export interface DAGExecutionResult {
  outputs: Record<string, any>
  durationMs: number
}

export async function executeDAG(
  nodes: DAGNode[],
  initialInputs: Record<string, any> = {}
): Promise<DAGExecutionResult> {
  const start = performance.now()
  const outputs: Record<string, any> = { ...initialInputs }
  const nodeMap = new Map<string, DAGNode>()

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
        const startNode = performance.now()
        const output = await node.execute(inputs)
        outputs[id] = {
          value: output,
          durationMs: performance.now() - startNode
        }
        return output
      })
      .catch(err => {
        throw new Error(`Failed to execute node '${id}': ${err.message}`, { cause: err })
      })

    promises.set(id, promise)
    return promise
  }

  await Promise.all(nodes.map(n => runNode(n.id)))

  return {
    outputs,
    durationMs: performance.now() - start
  }
}
