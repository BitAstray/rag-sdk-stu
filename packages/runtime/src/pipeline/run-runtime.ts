import type { Query } from "@rag-sdk/core"
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js"
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import type { RuntimeContext } from "../spec/context.js"
import type { RuntimeResult } from "../spec/runtime-result.js"
import { RuntimeError } from "../errors/runtime.js"

export interface InternalConfig {
  retriever: RuntimeRetriever
  generator: RuntimeGenerator
  preprocessor: QueryPreprocessor
  postprocessor: RetrievalPostprocessor
}

function now(): number {
  return performance.now()
}

export async function runRuntime(
  query: Query,
  config: InternalConfig,
): Promise<RuntimeResult> {
  const totalStart = now()
  const context: RuntimeContext = {
    originalQuery: query,
    preprocessed: null,
    chunks: [],
    promptContext: null,
    metadata: {},
  }

  // Stage 1: Pre-retrieval
  let preRetrievalResult
  try {
    const start = now()
    const preprocessed = await config.preprocessor.preprocess(query)
    const durationMs = now() - start

    context.preprocessed = preprocessed
    preRetrievalResult = {
      ...preprocessed,
      durationMs,
    }
  } catch (cause) {
    if (cause instanceof RuntimeError) throw cause
    throw new RuntimeError(
      "pre-retrieval",
      `Pre-retrieval failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      cause,
    )
  }

  // Stage 2: Retrieval
  let retrievalResult
  try {
    const start = now()
    const { chunks, debug } = await config.retriever.retrieve(
      context.preprocessed!,
      context,
    )
    const durationMs = now() - start

    context.chunks = chunks
    context.metadata.retrievalDebug = debug
    retrievalResult = {
      chunks,
      retrievedCount: chunks.length,
      durationMs,
    }
  } catch (cause) {
    if (cause instanceof RuntimeError) throw cause
    throw new RuntimeError(
      "retrieval",
      `Retrieval failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      cause,
    )
  }

  // Stage 3: Post-retrieval
  let postRetrievalResult
  try {
    const start = now()
    const { chunks, promptContext, debug } = await config.postprocessor.postprocess(
      context.preprocessed!,
      context.chunks,
      context,
    )
    const durationMs = now() - start

    context.chunks = chunks
    context.promptContext = promptContext
    context.metadata.postRetrievalDebug = debug
    postRetrievalResult = {
      chunks,
      promptContext,
      removedCount: retrievalResult.chunks.length - chunks.length,
      durationMs,
    }
  } catch (cause) {
    if (cause instanceof RuntimeError) throw cause
    throw new RuntimeError(
      "post-retrieval",
      `Post-retrieval failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      cause,
    )
  }

  // Stage 4: Generation
  let generationResult
  try {
    const start = now()
    const { answer, debug } = await config.generator.generate(
      context.preprocessed!,
      context.chunks,
      context.promptContext,
      context,
    )
    const durationMs = now() - start

    context.metadata.generationDebug = debug
    generationResult = {
      answer,
      durationMs,
    }
  } catch (cause) {
    if (cause instanceof RuntimeError) throw cause
    throw new RuntimeError(
      "generation",
      `Generation failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      cause,
    )
  }

  const durationMs = now() - totalStart

  return {
    answer: generationResult.answer,
    chunks: postRetrievalResult.chunks,
    originalQuery: context.originalQuery,
    preprocessed: context.preprocessed,
    preRetrieval: preRetrievalResult,
    retrieval: retrievalResult,
    postRetrieval: postRetrievalResult,
    generation: generationResult,
    durationMs,
  }
}
