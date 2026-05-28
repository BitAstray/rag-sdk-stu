import type { Chunk, Document, Vector } from "@rag-sdk/core"
import type { RAGObserver } from "@rag-sdk/observability"
import { createTraceId } from "@rag-sdk/observability"
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

export class IndexingStream<T> implements AsyncIterable<T> {
  constructor(
    private source: AsyncIterable<T>,
    public readonly result: IndexingResult,
    private readonly emitCtx?: EmitContext,
    private readonly pipelineStages: string[] = []
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
      stages
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

      return this.result
    } catch (err) {
      const durationMs = performance.now() - start

      // 发射 run.fail 事件
      if (this.emitCtx) {
        emitError(this.emitCtx, "run", "indexing.run.fail", err as Error, {
          durationMs,
        })
      }

      throw err
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

    // 创建 emit context
    const emitCtx = options?.observer
      ? createEmitContext(
          options.trace?.traceId || createTraceId(),
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

    return new IndexingStream(generate(), result, emitCtx, ["load"])
  },

  filter(predicate: (doc: Document, context: IndexingContext) => boolean): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let inputCount = 0
      let keptCount = 0
      const start = performance.now()

      for await (const item of source) {
        inputCount++
        try {
          if (predicate(item.doc, item.context)) {
            keptCount++
            yield item
          }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // filter 事件在 consume 时通过 IndexingStream 发射
    }
  },

  transform(transformer: DocumentTransformer): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let count = 0
      const start = performance.now()

      for await (const item of source) {
        try {
          const transformed = await transformer.transform(item.doc)
          count++
          yield { doc: transformed, context: item.context }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // transform 事件在 consume 时通过 IndexingStream 发射
    }
  },

  chunk(chunker: Chunker): Transform<{ doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let docCount = 0
      let totalChunks = 0
      const start = performance.now()

      for await (const item of source) {
        try {
          const chunks = await chunker.chunk(item.doc)
          result.totalDocuments++
          result.totalChunks += chunks.length
          docCount++
          totalChunks += chunks.length
          yield { chunks, context: item.context, doc: item.doc }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // chunk 事件在 consume 时通过 IndexingStream 发射
    }
  },

  metadata(builder: (doc: Document, chunk: Chunk, context: IndexingContext) => Record<string, string | number | boolean | string[] | null>): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let count = 0
      const start = performance.now()

      for await (const item of source) {
        try {
          const chunks = item.chunks.map(chunk => ({
            ...chunk,
            metadata: { ...chunk.metadata, ...builder(item.doc, chunk, item.context) }
          }))
          count++
          yield { chunks, context: item.context, doc: item.doc }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // metadata 事件在 consume 时通过 IndexingStream 发射
    }
  },

  embed(embedder: Embedder): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let chunkCount = 0
      let vectorCount = 0
      const start = performance.now()

      for await (const item of source) {
        try {
          const vectors = await embedder.embed(item.chunks)
          chunkCount += item.chunks.length
          vectorCount += vectors.length
          yield { vectors, context: item.context, doc: item.doc, chunks: item.chunks }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // embed 事件在 consume 时通过 IndexingStream 发射
    }
  },

  store(vectorStore: VectorStore): Transform<{ vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      let vectorCount = 0
      const start = performance.now()

      for await (const item of source) {
        try {
          await vectorStore.upsert(item.vectors)
          vectorCount += item.vectors.length
          yield item
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }

      const durationMs = performance.now() - start

      // store 事件在 consume 时通过 IndexingStream 发射
    }
  }
}
