/**
 * Demo: LangChain loader → chunker pipeline
 * Run: cd packages/adapters && pnpm demo
 */
import { MarkdownDirectoryLoader } from "../src/langchain/loaders/markdown-directory-loader.js"
import { RecursiveChunker } from "../src/langchain/chunkers/presets.js"

async function main() {
  // 1. Load markdown files from docs/
  const loader = new MarkdownDirectoryLoader("./docs")
  const documents = await loader.load()
  console.log(`Loaded ${documents.length} documents`)

  // 2. Chunk
  const chunker = new RecursiveChunker({ chunkSize: 500, chunkOverlap: 50 })
  let totalChunks = 0
  for (const doc of documents) {
    const chunks = await chunker.chunk(doc)
    totalChunks += chunks.length
    console.log(`  Doc "${doc.id}" → ${chunks.length} chunks`)
    for (const chunk of chunks) {
      console.log(`    Chunk ${chunk.id}: ${chunk.content.slice(0, 60)}...`)
    }
  }

  console.log(`\nTotal: ${documents.length} documents → ${totalChunks} chunks`)
  console.log("Pipeline complete. (Embedding step skipped — requires API key)")
}

main().catch(console.error)
