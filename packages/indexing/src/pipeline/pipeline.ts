import type { Chunk, Document, Vector } from "@rag-sdk/core"
import type { 
  Loader, 
  DocumentTransformer, 
  Chunker, 
  Embedder, 
  VectorStore, 
  IndexingResult, 
  IndexingContext 
} from "../types/index.js"

export type Transform<In, Out> = (source: AsyncIterable<In>, result: IndexingResult) => AsyncIterable<Out>

export class IndexingStream<T> implements AsyncIterable<T> {
  constructor(
    private source: AsyncIterable<T>,
    public readonly result: IndexingResult
  ) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  pipe<U>(transform: Transform<T, U>): IndexingStream<U> {
    return new IndexingStream(transform(this.source, this.result), this.result)
  }

  async consume(): Promise<IndexingResult> {
    for await (const _ of this.source) {
      // consume all items to pull them through the pipeline
    }
    return this.result
  }
}

export const PipelineSteps = {
  fromLoader(loader: Loader): IndexingStream<{ doc: Document; context: IndexingContext }> {
    const result: IndexingResult = { totalDocuments: 0, totalChunks: 0, errors: [] }
    
    async function* generate() {
      try {
        const docs = await loader.load()
        for (let i = 0; i < docs.length; i++) {
          yield { doc: docs[i], context: { documentIndex: i, totalDocuments: docs.length } }
        }
      } catch (err) {
        result.errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
    
    return new IndexingStream(generate(), result)
  },

  filter(predicate: (doc: Document, context: IndexingContext) => boolean): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          if (predicate(item.doc, item.context)) {
            yield item
          }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  },

  transform(transformer: DocumentTransformer): Transform<{ doc: Document; context: IndexingContext }, { doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          const transformed = await transformer.transform(item.doc)
          yield { doc: transformed, context: item.context }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  },

  chunk(chunker: Chunker): Transform<{ doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          const chunks = await chunker.chunk(item.doc)
          result.totalDocuments++
          result.totalChunks += chunks.length
          yield { chunks, context: item.context, doc: item.doc }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  },

  metadata(builder: (doc: Document, chunk: Chunk, context: IndexingContext) => Record<string, string | number | boolean | string[] | null>): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          const chunks = item.chunks.map(chunk => ({
            ...chunk,
            metadata: { ...chunk.metadata, ...builder(item.doc, chunk, item.context) }
          }))
          yield { chunks, context: item.context, doc: item.doc }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  },

  embed(embedder: Embedder): Transform<{ chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          const vectors = await embedder.embed(item.chunks)
          yield { vectors, context: item.context, doc: item.doc, chunks: item.chunks }
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  },

  store(vectorStore: VectorStore): Transform<{ vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }, { vectors: Vector[]; chunks: Chunk[]; doc: Document; context: IndexingContext }> {
    return async function* (source, result) {
      for await (const item of source) {
        try {
          await vectorStore.upsert(item.vectors)
          yield item
        } catch (err) {
          result.errors.push(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }
  }
}
