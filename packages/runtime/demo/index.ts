import {
  createRuntime,
  createDefaultRuntime,
  createPostprocessorPipeline,
  scoreThreshold,
  budgetTrim,
  CoreRetrieverWrapper,
  CoreGeneratorWrapper,
  NoopQueryPreprocessor,
  PassthroughRetrievalPostprocessor,
  RuntimeError,
} from "../src/index.js"
import type { Chunk } from "@rag-sdk/core"
import type {
  Retriever,
  Generator,
  RuntimeRetriever,
  RuntimeGenerator,
} from "../src/index.js"

console.log("=== @rag-sdk/runtime Demo ===\n")

// 运行结果是 DAGExecutionResult：outputs[nodeId] = { value, durationMs }
const valueOf = (result: { outputs: Record<string, any> }, nodeId: string) =>
  result.outputs[nodeId]?.value

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
console.log("Answer:", valueOf(result1, "generator").answer)
console.log("Candidates used:", valueOf(result1, "postprocessor").candidates.length)

// Demo 2: Custom DAG runtime with postprocessor strategies
console.log("\n--- Demo 2: Postprocessor Strategies (custom DAG) ---")

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
  budgetTrim({ maxCandidates: 2 }),
])
const preprocessor = new NoopQueryPreprocessor()

const strategyRuntime = createRuntime({
  nodes: [
    {
      id: "preprocessor",
      dependencies: ["query"],
      execute: async (inputs) => preprocessor.preprocess(inputs.query),
    },
    {
      id: "retriever",
      dependencies: ["preprocessor"],
      execute: async () => runtimeRetriever.retrieve({ originalQuery: "RAG", effectiveQuery: "RAG" }),
    },
    {
      id: "postprocessor",
      dependencies: ["preprocessor", "retriever"],
      execute: async (inputs) =>
        postprocessor.postprocess(inputs.preprocessor, inputs.retriever.candidates),
    },
    {
      id: "generator",
      dependencies: ["preprocessor", "postprocessor"],
      execute: async (inputs) =>
        runtimeGenerator.generate(inputs.preprocessor, inputs.postprocessor.candidates, inputs.postprocessor.promptContext),
    },
  ],
})

const result2 = await strategyRuntime.run({ query: "RAG" })
const post2 = valueOf(result2, "postprocessor")
console.log("Answer:", valueOf(result2, "generator").answer)
console.log("Selected candidates:", post2.candidates.length)
console.log("Detail selected:", post2.detail?.selectedCandidates.length)
console.log("Detail dropped:", post2.detail?.droppedCandidates.length)
console.log("Applied threshold:", post2.detail?.appliedScoreThreshold)

// Demo 3: Error handling — a failing stage surfaces as a node error
console.log("\n--- Demo 3: Stage Error ---")
const failingRuntime = createRuntime({
  nodes: [
    {
      id: "preprocessor",
      dependencies: ["query"],
      execute: async (inputs) => preprocessor.preprocess(inputs.query),
    },
    {
      id: "retriever",
      dependencies: ["preprocessor"],
      execute: async () => runtimeRetriever.retrieve({ originalQuery: "x", effectiveQuery: "x" }),
    },
    {
      id: "generator",
      dependencies: ["preprocessor", "retriever"],
      telemetry: {
        stage: "generation",
        events: { start: "runtime.generation.start", complete: "runtime.generation.complete", fail: "runtime.generation.fail" },
      },
      execute: async () => {
        throw new RuntimeError("generation", "LLM down")
      },
    },
  ],
})

try {
  await failingRuntime.run({ query: "test" })
} catch (e) {
  console.log("Caught error:", (e as Error).message)
}

// Demo 4: Passthrough postprocessor used standalone
console.log("\n--- Demo 4: Passthrough Postprocessor ---")
const passthrough = new PassthroughRetrievalPostprocessor()
const wrapped = new CoreRetrieverWrapper(retriever)
const wrappedGen = new CoreGeneratorWrapper(generator)
const retrieved = await wrapped.retrieve({ originalQuery: "RAG", effectiveQuery: "RAG" })
const processed = await passthrough.postprocess({ originalQuery: "RAG", effectiveQuery: "RAG" }, retrieved.candidates)
const generated = await wrappedGen.generate({ originalQuery: "RAG", effectiveQuery: "RAG" }, processed.candidates, processed.promptContext)
console.log("Passthrough answer:", generated.answer)

console.log("\n=== Demo Complete ===")
