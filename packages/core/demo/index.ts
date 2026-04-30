import {
  QuerySchema,
  ChunkSchema,
  RAGResponseSchema,
  ValidationError,
  RetrievalError,
  GenerationError,
} from "../src/index.js"
import type { Query, Chunk, RAGResponse, Retriever, Generator, RAGPipeline } from "../src/index.js"

console.log("=== @rag-sdk/core Demo ===\n")

// 1. Schema validation
console.log("--- Schema Validation ---")
const query: Query = QuerySchema.parse({ query: "什么是 RAG？" })
console.log("Query:", query)

const chunk: Chunk = ChunkSchema.parse({
  id: "doc-1",
  content: "RAG 是检索增强生成（Retrieval-Augmented Generation）的缩写。",
  metadata: { source: "wiki", tags: ["ai", "rag"] },
})
console.log("Chunk:", chunk)

const response: RAGResponse = RAGResponseSchema.parse({
  answer: "RAG 是检索增强生成技术。",
  chunks: [chunk],
})
console.log("RAGResponse:", response)

// 2. Interface mock
console.log("\n--- Interface Mock ---")
const mockRetriever: Retriever = {
  async retrieve(q) {
    return [chunk]
  },
}

const mockGenerator: Generator = {
  async generate({ query, chunks }) {
    return `Based on ${chunks.length} chunks: RAG is great!`
  },
}

const pipeline: RAGPipeline = async (q) => {
  const chunks = await mockRetriever.retrieve(q)
  const answer = await mockGenerator.generate({ query: q, chunks })
  return RAGResponseSchema.parse({ answer, chunks })
}

const result = await pipeline(query)
console.log("Pipeline result:", result)

// 3. Error handling
console.log("\n--- Error Handling ---")
try {
  QuerySchema.parse({ query: "" })
} catch (e) {
  const err = new ValidationError("Query validation failed", e)
  console.log(`${err.name} [${err.code}]: ${err.message}`)
}

try {
  throw new RetrievalError("Vector store connection timeout")
} catch (e) {
  console.log(`${(e as Error).name} [${(e as RetrievalError).code}]: ${(e as Error).message}`)
}

try {
  throw new GenerationError("LLM API rate limit exceeded")
} catch (e) {
  console.log(`${(e as Error).name} [${(e as GenerationError).code}]: ${(e as Error).message}`)
}

console.log("\n=== Demo Complete ===")
