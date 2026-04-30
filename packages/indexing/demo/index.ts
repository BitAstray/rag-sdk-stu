import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  MarkdownLoader,
  SimpleChunker,
  MockEmbedder,
  MemoryVectorStore,
  runIndexing,
} from "../src/index.js"

console.log("=== @rag-sdk/indexing Demo ===\n")

// create temp markdown files
const dir = join(tmpdir(), "indexing-demo-" + Date.now())
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, "rag-intro.md"), `# RAG 简介\n\nRAG（Retrieval-Augmented Generation）是一种结合检索和生成的 AI 架构。它先从知识库中检索相关文档片段，再将检索结果作为上下文传入大语言模型生成回答。`)
writeFileSync(join(dir, "vector-db.md"), `# 向量数据库\n\n向量数据库是存储和检索高维向量的专用数据库。常见的向量数据库包括 Pinecone、Weaviate、Milvus 和 Qdrant。`)

try {
  const store = new MemoryVectorStore()

  const result = await runIndexing({
    loader: new MarkdownLoader(dir),
    chunker: new SimpleChunker({ chunkSize: 50, overlap: 10 }),
    embedder: new MockEmbedder({ dimension: 32 }),
    store,
    metadataBuilder: (doc, chunk) => ({
      sourceDoc: doc.id,
      indexedAt: new Date().toISOString(),
    }),
  })

  console.log("--- Indexing Result ---")
  console.log(`Documents processed: ${result.totalDocuments}`)
  console.log(`Chunks created: ${result.totalChunks}`)
  console.log(`Errors: ${result.errors.length}`)

  console.log("\n--- Stored Vectors ---")
  for (const vector of store.getAll()) {
    console.log(`  ${vector.id}: ${vector.values.length}D vector, metadata: ${JSON.stringify(vector.metadata)}`)
  }

  console.log("\n=== Demo Complete ===")
} finally {
  rmSync(dir, { recursive: true, force: true })
}
