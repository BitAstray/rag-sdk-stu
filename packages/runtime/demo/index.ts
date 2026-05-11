import {
  createRuntime,
  createDefaultRuntime,
  createPostprocessorPipeline,
  scoreThreshold,
  budgetTrim,
  RuntimeError,
} from "../src/index.js"
import type { Chunk } from "@rag-sdk/core"
import type {
  Retriever,
  Generator,
  RuntimeRetriever,
  RuntimeGenerator,
  QueryPreprocessor,
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
console.log("Candidates used:", result1.candidates.length)

// Demo 2: Default postprocessor with strategies
console.log("\n--- Demo 2: Default Postprocessor with Strategies ---")

const runtimeRetriever: RuntimeRetriever = {
  async retrieve() {
    return {
      candidates: [
        { id: "c1", content: "RAG combines retrieval and generation.", rerankingScore: 0.95, source: "docs" },
        { id: "c2", content: "Vector databases store embeddings.", rerankingScore: 0.8, source: "docs" },
        { id: "c3", content: "RAG combines retrieval and generation.", rerankingScore: 0.7, source: "blog" },
        { id: "c4", content: "Low relevance content.", rerankingScore: 0.2, source: "wiki" },
      ],
    }
  },
}

const runtimeGenerator: RuntimeGenerator = {
  async generate(query, candidates) {
    return {
      answer: `Answering "${query.effectiveQuery}" using ${candidates.length} candidates.`,
    }
  },
}

const postprocessor = createPostprocessorPipeline([
  scoreThreshold(0.5),
  budgetTrim({ maxCandidates: 2 })
])

const strategyRuntime = createRuntime({
  retriever: runtimeRetriever,
  generator: runtimeGenerator,
  postprocessor,
})

const result2 = await strategyRuntime.run({ query: "RAG" })
console.log("Answer:", result2.answer)
console.log("Selected:", result2.postRetrieval?.selectedCandidates.length)
console.log("Dropped:", result2.postRetrieval?.droppedCandidates.length)
console.log("Applied threshold:", result2.postRetrieval?.appliedScoreThreshold)
console.log("Applied budget:", result2.postRetrieval?.appliedBudget)
console.log("Trace entries:", result2.postRetrieval?.selectionTrace.length)
console.log("Dropped reasons:", result2.postRetrieval?.selectionTrace.filter(t => t.action === "dropped").map(t => `${t.candidateId}: ${t.reason}`))

// Demo 3: Custom runtime with all 4 stages
console.log("\n--- Demo 3: Custom 4-Stage Runtime ---")

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
  async retrieve(input) {
    const filtered = chunks.filter((c) =>
      c.content.toLowerCase().includes(input.effectiveQuery),
    )
    return {
      candidates: filtered.slice(0, input.topK ?? 10).map(c => ({
        id: c.id,
        content: c.content,
        metadata: c.metadata as Record<string, unknown> | undefined,
      })),
      debug: { source: "memory" },
    }
  },
}

const customRuntime = createRuntime({
  retriever: customRetriever,
  generator: runtimeGenerator,
  preprocessor: customPreprocessor,
  postprocessor: createPostprocessorPipeline([]),
})

const result3 = await customRuntime.run({ query: "  RAG  " })
console.log("Answer:", result3.answer)
console.log("Preprocessed:", result3.preprocessed)

// Demo 4: Error handling
console.log("\n--- Demo 4: Stage Error ---")
const failingRuntime = createRuntime({
  retriever: customRetriever,
  generator: {
    async generate() {
      throw new Error("LLM down")
    },
  },
  preprocessor: customPreprocessor,
  postprocessor: createPostprocessorPipeline([]),
})

try {
  await failingRuntime.run({ query: "test" })
} catch (e) {
  if (e instanceof RuntimeError) {
    console.log(`RuntimeError [${e.stage}]: ${e.message}`)
  }
}

console.log("\n=== Demo Complete ===")
