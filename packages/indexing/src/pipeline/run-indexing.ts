import type { Chunk, Document } from "@rag-sdk/core"
import type { IndexingOptions, IndexingResult, IndexingContext } from "../types/index.js"
import { SimpleChunker } from "../chunkers/simple-chunker.js"

export async function runIndexing(options: IndexingOptions): Promise<IndexingResult> {
  const {
    loader,
    chunker = new SimpleChunker(),
    embedder,
    store,
    transformer,
    shouldIndex,
    metadataBuilder,
    onError,
  } = options

  const result: IndexingResult = {
    totalDocuments: 0,
    totalChunks: 0,
    errors: [],
  }

  let docs: Document[]
  try {
    docs = await loader.load()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    result.errors.push(error)
    onError?.(error, undefined, { documentIndex: 0, totalDocuments: 0 })
    return result
  }

  for (let i = 0; i < docs.length; i++) {
    const context: IndexingContext = {
      documentIndex: i,
      totalDocuments: docs.length,
    }

    let doc = docs[i]

    // filter
    if (shouldIndex && !shouldIndex(doc, context)) continue

    // transform
    if (transformer) {
      try {
        doc = await transformer.transform(doc)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        result.errors.push(error)
        onError?.(error, doc, context)
        continue
      }
    }

    // chunk
    let chunks: Chunk[]
    try {
      chunks = await chunker.chunk(doc)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      result.errors.push(error)
      onError?.(error, doc, context)
      continue
    }

    // metadata
    if (metadataBuilder) {
      chunks = chunks.map((chunk) => ({
        ...chunk,
        metadata: { ...chunk.metadata, ...metadataBuilder(doc, chunk, context) },
      }))
    }

    // embed
    let vectors
    try {
      vectors = await embedder.embed(chunks)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      result.errors.push(error)
      onError?.(error, doc, context)
      continue
    }

    // store
    try {
      await store.upsert(vectors)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      result.errors.push(error)
      onError?.(error, doc, context)
      continue
    }

    result.totalDocuments++
    result.totalChunks += chunks.length
  }

  return result
}
