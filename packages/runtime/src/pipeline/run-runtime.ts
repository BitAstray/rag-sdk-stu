import type { Query } from "@rag-sdk/core"
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js"
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js"
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js"
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js"
import type { RuntimeContext } from "../spec/context.js"
import type { RuntimeResult } from "../spec/runtime-result.js"
import { wrapStageError } from "../errors/runtime.js"

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
    candidates: [],
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
    throw wrapStageError("pre-retrieval", cause)
  }

  // Stage 2: Retrieval
  let retrievalResult
  try {
    const start = now()
    const { candidates, debug } = await config.retriever.retrieve(
      context.preprocessed!,
    )
    const durationMs = now() - start

    context.candidates = candidates
    context.metadata.retrievalDebug = debug
    retrievalResult = {
      candidates,
      retrievedCount: candidates.length,
      durationMs,
    }
  } catch (cause) {
    throw wrapStageError("retrieval", cause)
  }

  // Stage 3: Post-retrieval
  let postRetrievalResult
  try {
    const start = now()
    const {
      candidates: postCandidates,
      promptContext,
      detail,
    } = await config.postprocessor.postprocess(
      context.preprocessed!,
      context.candidates,
    )
    const durationMs = now() - start

    context.candidates = postCandidates
    context.promptContext = promptContext
    context.metadata.postRetrievalDebug = detail?.debug
    postRetrievalResult = {
      candidates: postCandidates,
      promptContext,
      selectedCandidates: detail?.selectedCandidates ?? postCandidates,
      droppedCandidates: detail?.droppedCandidates ?? [],
      selectionTrace: detail?.selectionTrace ?? [],
      appliedScoreThreshold: detail?.appliedScoreThreshold,
      appliedBudget: detail?.appliedBudget,
      removedCount: retrievalResult.candidates.length - postCandidates.length,
      durationMs,
    }
  } catch (cause) {
    throw wrapStageError("post-retrieval", cause)
  }

  // Stage 4: Generation
  let generationResult
  try {
    const start = now()
    const { answer, debug } = await config.generator.generate(
      context.preprocessed!,
      context.candidates,
      context.promptContext,
    )
    const durationMs = now() - start

    context.metadata.generationDebug = debug
    generationResult = {
      answer,
      durationMs,
    }
  } catch (cause) {
    throw wrapStageError("generation", cause)
  }

  const durationMs = now() - totalStart

  return {
    answer: generationResult.answer,
    candidates: postRetrievalResult.candidates,
    originalQuery: context.originalQuery,
    preprocessed: context.preprocessed,
    preRetrieval: preRetrievalResult,
    retrieval: retrievalResult,
    postRetrieval: postRetrievalResult,
    generation: generationResult,
    durationMs,
  }
}
