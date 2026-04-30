import {
  createRuntime,
  createDefaultRuntime,
  RuntimeError,
} from "../src/index.js"
import type { Chunk } from "@rag-sdk/core"
import type {
  Retriever,
  Generator,
  RuntimeRetriever,
  RuntimeGenerator,
  QueryPreprocessor,
  RetrievalPostprocessor,
} from "../src/index.js"

console.log("=== @rag-sdk/runtime Demo ===\n")

// Demo 1: createDefaultRuntime with core interfaces
console.log("--- Demo 1: Default Runtime ---")
const chunks: Chunk[] = [
  { id: "c1", content: "RAG combines retrieval and generation." },
  { id: "c2", content: "Vector databases store embeddings." },
]

const retriever: Retriever = {
  async retrieve(q) {
    return chunks.filter((c) => c.content.includes(q.query))
  },
}
const generator: Generator = {
  async generate({ query, chunks }) {
    return `Based on ${chunks.length} chunks about "${query.query}": RAG is powerful.`
  },
}

const defaultRuntime = createDefaultRuntime({ retriever, generator })
const result1 = await defaultRuntime.run({ query: "RAG" })
console.log("Answer:", result1.answer)
console.log("Chunks used:", result1.chunks.length)
console.log("Pre-retrieval duration:", result1.preRetrieval?.durationMs, "ms")

// Demo 2: Custom runtime with all 4 stages
console.log("\n--- Demo 2: Custom 4-Stage Runtime ---")

const customPreprocessor: QueryPreprocessor = {
  async preprocess(query) {
    return {
      originalQuery: query.query,
      effectiveQuery: query.query.toLowerCase().trim(),
      topK: 3,
      strategy: "semantic",
    }
  },
}

const customRetriever: RuntimeRetriever = {
  __runtimeRetriever: true,
  async retrieve(input) {
    const filtered = chunks.filter((c) =>
      c.content.toLowerCase().includes(input.effectiveQuery),
    )
    return {
      chunks: filtered.slice(0, input.topK ?? 10),
      debug: { source: "memory" },
    }
  },
}

const customPostprocessor: RetrievalPostprocessor = {
  async postprocess(_query, retrieved) {
    const context = retrieved.map((c) => `[${c.id}] ${c.content}`).join("\n")
    return { chunks: retrieved, promptContext: context, debug: { assembled: true } }
  },
}

const customGenerator: RuntimeGenerator = {
  __runtimeGenerator: true,
  async generate(query, retrieved) {
    return {
      answer: `Answering "${query.effectiveQuery}" using ${retrieved.length} chunks.`,
      debug: { model: "mock" },
    }
  },
}

const customRuntime = createRuntime({
  retriever: customRetriever,
  generator: customGenerator,
  preprocessor: customPreprocessor,
  postprocessor: customPostprocessor,
})

const result2 = await customRuntime.run({ query: "  RAG  " })
console.log("Answer:", result2.answer)
console.log("Preprocessed:", result2.preprocessed)
console.log("Prompt context:", result2.postRetrieval?.promptContext)
console.log("Total duration:", result2.durationMs, "ms")

// Demo 3: Error handling
console.log("\n--- Demo 3: Stage Error ---")
const failingRuntime = createRuntime({
  retriever: customRetriever,
  generator: {
    async generate() {
      throw new Error("LLM down")
    },
  },
  preprocessor: customPreprocessor,
  postprocessor: customPostprocessor,
})

try {
  await failingRuntime.run({ query: "test" })
} catch (e) {
  if (e instanceof RuntimeError) {
    console.log(`RuntimeError [${e.stage}]: ${e.message}`)
  }
}

console.log("\n=== Demo Complete ===")
