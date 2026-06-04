import { describe, it, expect, vi } from 'vitest'
import { executeDAG, type DAGNode } from '../../src/pipeline/dag.js'

describe('executeDAG', () => {
  it('应执行单个无依赖节点', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output-a',
    }

    const result = await executeDAG([node])

    expect(result.outputs.a.value).toBe('output-a')
    expect(result.durationMs).toBeTypeOf('number')
  })

  it('应执行有依赖的节点', async () => {
    const nodeA: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 10,
    }

    const nodeB: DAGNode = {
      id: 'b',
      dependencies: ['a'],
      execute: (inputs) => inputs.a + 20,
    }

    const result = await executeDAG([nodeA, nodeB])

    expect(result.outputs.a.value).toBe(10)
    expect(result.outputs.b.value).toBe(30)
  })

  it('应支持并行执行无依赖节点', async () => {
    const order: string[] = []

    const nodeA: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: async () => {
        await new Promise((r) => setTimeout(r, 10))
        order.push('a')
        return 'a'
      },
    }

    const nodeB: DAGNode = {
      id: 'b',
      dependencies: [],
      execute: async () => {
        order.push('b')
        return 'b'
      },
    }

    const result = await executeDAG([nodeA, nodeB])

    expect(result.outputs.a.value).toBe('a')
    expect(result.outputs.b.value).toBe('b')
    // b 应该在 a 之前完成（因为 a 有延迟）
    expect(order).toEqual(['b', 'a'])
  })

  it('应检测重复节点 ID', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output',
    }

    await expect(executeDAG([node, node])).rejects.toThrow('Duplicate node id')
  })

  it('应检测循环依赖', async () => {
    const nodeA: DAGNode = {
      id: 'a',
      dependencies: ['b'],
      execute: () => 'a',
    }

    const nodeB: DAGNode = {
      id: 'b',
      dependencies: ['a'],
      execute: () => 'b',
    }

    await expect(executeDAG([nodeA, nodeB])).rejects.toThrow('Circular dependency')
  })

  it('应检测缺失的依赖', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: ['missing'],
      execute: () => 'a',
    }

    await expect(executeDAG([node])).rejects.toThrow('not found')
  })

  it('应传播节点执行错误', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => {
        throw new Error('node error')
      },
    }

    await expect(executeDAG([node])).rejects.toThrow('node error')
  })

  it('应支持初始输入', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output',
    }

    const result = await executeDAG([node], { input: 'test' })

    expect(result.outputs.input).toBe('test')
  })

  it('应生成 traceId', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output',
    }

    const result = await executeDAG([node])

    expect(result.traceId).toMatch(/^trace-/)
  })

  it('应使用提供的 traceId', async () => {
    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output',
    }

    const result = await executeDAG([node], {}, { traceId: 'custom-trace' })

    expect(result.traceId).toBe('custom-trace')
  })

  it('应发射事件到 observer', async () => {
    const observer = {
      onEvent: vi.fn(),
    }

    const node: DAGNode = {
      id: 'a',
      dependencies: [],
      execute: () => 'output',
    }

    await executeDAG([node], {}, { observer })

    // 应该有 start 和 complete 事件
    expect(observer.onEvent).toHaveBeenCalled()
  })
})
