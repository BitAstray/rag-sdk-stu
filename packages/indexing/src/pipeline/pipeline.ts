import type { Chunk, Document, Vector } from "@rag-sdk/core"
import type { RAGObserver, TraceHandle } from "@rag-sdk/observability"
import { createId } from "@rag-sdk/utils"
import type {
  Loader,
  DocumentTransformer,
  Chunker,
  Embedder,
  VectorStore,
  IndexingResult,
  IndexingContext,
} from "../types/index.js"
import type { EmitContext } from "../observer/emit.js"
import { emitEvent, emitError, createEmitContext } from "../observer/emit.js"

export type Transform<In, Out> = (source: AsyncIterable<In>, result: IndexingResult) => AsyncIterable<Out>

export interface TransformOptions {
  batchSize?: number
  concurrency?: number
  retry?: number
}

export class IndexingStream<T> implements AsyncIterable<T> {
  constructor(
    private source: AsyncIterable<T>,
    public readonly result: IndexingResult,
    private readonly emitCtx?: EmitContext,
    private readonly pipelineStages: string[] = [],
    private readonly traceHandle?: TraceHandle
  ) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  pipe<U>(transform: Transform<T, U>, stageName?: string): IndexingStream<U> {
    const stages = stageName
      ? [...this.pipelineStages, stageName]
      : this.pipelineStages
    return new IndexingStream(
      transform(this.source, this.result),
      this.result,
      this.emitCtx,
      stages,
      this.traceHandle
    )
  }

  async consume(): Promise<IndexingResult> {
    const start = performance.now()

    // 发射 run.start 事件
    if (this.emitCtx) {
      emitEvent(this.emitCtx, "run", "indexing.run.start", {
        totalDocuments: this.result.totalDocuments,
      })
    }

    try {
      for await (const _ of this.source) {
        // consume all items to pull them through the pipeline
      }

      const durationMs = performance.now() - start

      // 发射 run.complete 事件
      if (this.emitCtx) {
        emitEvent(this.emitCtx, "run", "indexing.run.complete", {
          totalDocuments: this.result.totalDocuments,
          totalChunks: this.result.totalChunks,
          errorCount: this.result.errors.length,
          pipelineStages: this.pipelineStages,
        }, durationMs)
      }

      this.traceHandle?.end("ok")
      return this.result
    } catch (err) {
      const durationMs = performance.now() - start

      // 发射 run.fail 事件
      if (this.emitCtx) {
        emitError(this.emitCtx, "run", "indexing.run.fail", err as Error, {
          durationMs,
        })
      }

      this.traceHandle?.end("error")
      throw err
    }
  }
}

/**
 * 隐式管线调度器：支持批处理、并发调度与错误重试
 */
function createScheduler<In, Out>(
  options: TransformOptions | undefined,
  processBatch: (batch: In[], result: IndexingResult) => Promise<Out[]>
): Transform<In, Out> {
  return async function* (source, result) {
    const batchSize = Math.max(1, options?.batchSize ?? 1)
    const concurrency = Math.max(1, options?.concurrency ?? 1)
    const retries = Math.max(0, options?.retry ?? 0)

    let batch: In[] = []
    const pending = new Set<Promise<{ results: Out[] | Error, promise: any }>>()

    const submitBatch = (currentBatch: In[]) => {
      const promise: any = (async () => {
        let attempt = 0
        while (true) {
          try {
            const results = await processBatch(currentBatch, result)
            return { results, promise }
          } catch (err) {
            if (attempt >= retries) {
              return { results: err instanceof Error ? err : new Error(String(err)), promise }
            }
            attempt++
          }
        }
      })()
      pending.add(promise)
    }

    for await (const item of source) {
      batch.push(item)
      if (batch.length >= batchSize) {
        submitBatch(batch)
        batch = []

        if (pending.size >= concurrency) {
          const winner = await Promise.race(pending)
          pending.delete(winner.promise)
          if (winner.results instanceof Error) {
            result.errors.push(winner.results)
          } else {
            for (const out of winner.results) yield out
          }
        }
      }
    }

    if (batch.length > 0) {
      submitBatch(batch)
    }

    while (pending.size > 0) {
      const winner = await Promise.race(pending)
      pending.delete(winner.promise)
      if (winner.results instanceof Error) {
        result.errors.push(winner.results)
      } else {
        for (const out of winner.results) yield out
      }
    }
  }
}

export const PipelineSteps = {
  fromLoader(
    loader: Loader,
    options?: {
      observer?: RAGObserver
      trace?: {
        traceId?: string
        dataset?: string
        version?: string
        tags?: Record<string, string | number | boolean>
      }
    }
  ): IndexingStream<{ doc: Document; context: IndexingContext }> {
    const result: IndexingResult = { totalDocuments: 0, totalChunks: 0, errors: [] }

    const traceId = options?.trace?.traceId || createId("trace")
    const traceHandle = options?.observer?.startTrace?.(traceId, "indexing")

    // 创建 emit context
    const emitCtx = options?.observer
      ? createEmitContext(
          traceId,
          options.observer,
          {
            dataset: options.trace?.dataset,
            version: options.trace?.version,
            tags: options.trace?.tags,
          }
        )
      : undefined

    async function* generate() {
      const start = performance.now()

      try {
        const docs = await loader.load()
        const durationMs = performance.now() - start

        // 发射 load.complete 事件
        if (emitCtx) {
          emitEvent(emitCtx, "load", "indexing.load.complete", {
            documentCount: docs.length,
          }, durationMs)
        }

        for (let i = 0; i < docs.length; i++) {
          yield { doc: docs[i], context: { documentIndex: i, totalDocuments: docs.length } }
        }
      } catch (err) {
        const durationMs = performance.now() - start

        // 发射 load.fail 事件
        if (emitCtx) {
          emitError(emitCtx, "load", "indexing.load.fail", err as Error, {
            durationMs,
          })
        }

        result.errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }

    return new IndexingStream(generate(), result, emitCtx, ["load"], traceHandle)
  },

  filter(
    predicate: (doc: Document, context: IndexingContext) => boolean,
    options?: TransformOptions
  ): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch) => {
      return batch.filter(item => predicate(item.doc, item.context))
    })
  },

  transform(
    transformer: DocumentTransformer,
    options?: TransformOptions
  ): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch) => {
      return await Promise.all(batch.map(async item => {
        const doc = await transformer.transform(item.doc)
        return { doc, context: item.context }
      }))
    })
  },

  chunk(
    chunker: Chunker,
    options?: TransformOptions
  ): Transform<{ doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch, result) => {
      return await Promise.all(batch.map(async item => {
        const chunks = await chunker.chunk(item.doc)
        result.totalDocuments++
        result.totalChunks += chunks.length
        return { chunks, context: item.context, doc: item.doc }
      }))
    })
  },

  metadata(
    builder: (doc: Document, chunk: Chunk, context: IndexingContext) => Record<string, string | number | boolean | string[] | null>,
    options?: TransformOptions
  ): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch) => {
      return batch.map(item => {
        const chunks = item.chunks.map(chunk => ({
          ...chunk,
          metadata: { ...chunk.metadata, ...builder(item.doc, chunk, item.context) }
        }))
        return { chunks, context: item.context, doc: item.doc }
      })
    })
  },

  embed(
    embedder: Embedder,
    options?: TransformOptions
  ): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch) => {
      const allChunks = batch.flatMap(item => item.chunks)
      if (allChunks.length === 0) {
        return batch.map(item => ({ vectors: [], ...item }))
      }
      
      const vectors = await embedder.embed(allChunks)
      
      let offset = 0
      return batch.map(item => {
        const itemVectors = vectors.slice(offset, offset + item.chunks.length)
        offset += item.chunks.length
        return { vectors: itemVectors, ...item }
      })
    })
  },

  store(
    vectorStore: VectorStore,
    options?: TransformOptions
  ): Transform<{ vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return createScheduler(options, async (batch) => {
      const allVectors = batch.flatMap(item => item.vectors)
      if (allVectors.length > 0) {
        await vectorStore.upsert(allVectors)
      }
      return batch
    })
  }
}
