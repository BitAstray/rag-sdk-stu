import { describe, it, expect } from "vitest"
import * as core from "@rag-sdk/core"
import * as indexing from "@rag-sdk/indexing"
import * as runtime from "@rag-sdk/runtime"
import * as adapters from "@rag-sdk/adapters"

describe("export integrity", () => {
  describe("@rag-sdk/core", () => {
    it("exports schemas", () => {
      expect(core.QuerySchema).toBeDefined()
      expect(core.ChunkSchema).toBeDefined()
      expect(core.DocumentSchema).toBeDefined()
      expect(core.VectorSchema).toBeDefined()
      expect(core.RAGResponseSchema).toBeDefined()
    })

    it("exports error classes", () => {
      expect(core.RagError).toBeDefined()
      expect(core.ValidationError).toBeDefined()
      expect(core.RetrievalError).toBeDefined()
      expect(core.GenerationError).toBeDefined()
    })

    it("schemas parse valid data", () => {
      expect(core.QuerySchema.parse({ query: "test" })).toEqual({ query: "test" })
      expect(core.ChunkSchema.parse({ id: "1", content: "text" })).toBeTruthy()
      expect(core.DocumentSchema.parse({ id: "1", content: "text" })).toBeTruthy()
    })
  })

  describe("@rag-sdk/indexing", () => {
    it("exports default components", () => {
      expect(indexing.SimpleChunker).toBeDefined()
      expect(indexing.MockEmbedder).toBeDefined()
      expect(indexing.MemoryVectorStore).toBeDefined()
      expect(indexing.MarkdownLoader).toBeDefined()
    })

    it("exports pipeline", () => {
      expect(indexing.PipelineSteps).toBeDefined()
      expect(typeof indexing.PipelineSteps.fromLoader).toBe("function")
    })

    it("exports defaults", () => {
      expect(indexing.DEFAULT_CHUNK_SIZE).toBeDefined()
      expect(indexing.DEFAULT_OVERLAP).toBeDefined()
      expect(indexing.DEFAULT_BATCH_SIZE).toBeDefined()
      expect(indexing.DEFAULT_VECTOR_DIMENSION).toBeDefined()
    })

    it("exports error class", () => {
      expect(indexing.IndexingError).toBeDefined()
    })
  })

  describe("@rag-sdk/runtime", () => {
    it("exports pipeline", () => {
      expect(runtime.createRuntime).toBeDefined()
      expect(typeof runtime.createRuntime).toBe("function")
    })

    it("exports defaults", () => {
      expect(runtime.NoopQueryPreprocessor).toBeDefined()
      expect(runtime.PassthroughRetrievalPostprocessor).toBeDefined()
      expect(runtime.createDefaultRuntime).toBeDefined()
    })

    it("exports error class", () => {
      expect(runtime.RuntimeError).toBeDefined()
    })

    it("exports schemas", () => {
      expect(runtime.PreprocessedQuerySchema).toBeDefined()
      expect(runtime.RuntimeResultSchema).toBeDefined()
    })
  })

  describe("@rag-sdk/adapters", () => {
    it("exports langchain namespace", () => {
      expect(adapters.langchain).toBeDefined()
      expect(adapters.langchain.loaders).toBeDefined()
      expect(adapters.langchain.chunkers).toBeDefined()
      expect(adapters.langchain.embedders).toBeDefined()
    })

    it("exports chroma namespace", () => {
      expect(adapters.chroma).toBeDefined()
      expect(adapters.chroma.stores).toBeDefined()
    })

    it("exports shared namespace", () => {
      expect(adapters.shared).toBeDefined()
      expect(adapters.shared.normalizeMetadataValue).toBeDefined()
      expect(adapters.shared.normalizeMetadata).toBeDefined()
      expect(adapters.shared.mergeMetadata).toBeDefined()
    })
  })
})
