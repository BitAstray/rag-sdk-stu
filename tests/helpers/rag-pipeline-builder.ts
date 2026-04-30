import type { Generator, Chunk, Retriever } from "@rag-sdk/core"
import { MemoryVectorStore, MockEmbedder, SimpleChunker } from "@rag-sdk/indexing"
import { InMemoryRetriever } from "./in-memory-retriever.js"

export interface TestPipelineComponents {
  store: MemoryVectorStore
  embedder: MockEmbedder
  chunker: SimpleChunker
  retriever: InMemoryRetriever
  generator: Generator
  coreRetriever: Retriever
}

export function buildTestPipeline(): TestPipelineComponents {
  const store = new MemoryVectorStore()
  const embedder = new MockEmbedder()
  const chunker = new SimpleChunker()
  const retriever = new InMemoryRetriever(store)
  const generator: Generator = {
    async generate({ chunks }: { chunks: Chunk[] }) {
      return chunks.map((c) => c.content).join("\n")
    },
  }
  const coreRetriever: Retriever = {
    retrieve: (query) => retriever.retrieve(query),
  }

  return { store, embedder, chunker, retriever, generator, coreRetriever }
}
