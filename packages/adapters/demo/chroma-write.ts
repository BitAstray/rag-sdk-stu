/**
 * Demo: Write vectors to Chroma (requires Chroma server on localhost:8000)
 * Run: cd packages/adapters && tsx demo/chroma-write.ts
 */
import { ChromaVectorStore } from "../src/chroma/stores/chroma-vector-store.js"
import type { Vector } from "@rag-sdk/core"

async function main() {
  // Requires a running Chroma instance and chromadb package
  // This demo shows the API surface; actual execution needs Chroma server.
  console.log("Chroma Write Demo")
  console.log("=================")
  console.log()
  console.log("This demo requires:")
  console.log("  1. A running Chroma server on localhost:8000")
  console.log('  2. npm install chromadb')
  console.log()
  console.log("Example usage:")
  console.log()
  console.log('  const store = new ChromaVectorStore({')
  console.log('    collectionName: "demo-collection",')
  console.log('    client: new ChromaClient({ path: "http://localhost:8000" }),')
  console.log("  })")
  console.log()
  console.log("  const vectors: Vector[] = [")
  console.log('    { id: "v1", values: [0.1, 0.2, 0.3], metadata: { source: "demo" } },')
  console.log('    { id: "v2", values: [0.4, 0.5, 0.6], metadata: { source: "demo" } },')
  console.log("  ]")
  console.log()
  console.log("  await store.upsert(vectors)")
  console.log('  console.log("Done!")')
}

main().catch(console.error)
