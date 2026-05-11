import type { RetrievalPostprocessor, RetrievalPostprocessorResult } from "../../interfaces/retrieval-postprocessor.js"
import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { PreprocessedQuery } from "../../spec/preprocessed-query.js"
import type { SelectionTraceItem } from "../../spec/selection-trace.js"
import type { AppliedBudget } from "../../spec/stage-result.js"

export interface PostprocessorContext {
  query: PreprocessedQuery
  candidates: RetrievalCandidate[]
  dropped: RetrievalCandidate[]
  trace: SelectionTraceItem[]
  appliedScoreThreshold?: number
  appliedBudget?: AppliedBudget
  promptContext?: string | null
}

export type PostprocessorStep = (context: PostprocessorContext) => Promise<PostprocessorContext> | PostprocessorContext

export function createPostprocessorPipeline(steps: PostprocessorStep[]): RetrievalPostprocessor {
  return {
    async postprocess(
      query: PreprocessedQuery,
      candidates: RetrievalCandidate[],
    ): Promise<RetrievalPostprocessorResult> {
      let context: PostprocessorContext = {
        query,
        candidates,
        dropped: [],
        trace: [],
      }

      for (const step of steps) {
        context = await step(context)
      }

      const promptContext = context.promptContext ?? 
        (context.candidates.length > 0 ? context.candidates.map(c => c.content).join("\n\n") : null)

      return {
        candidates: context.candidates,
        promptContext,
        detail: {
          selectedCandidates: context.candidates,
          droppedCandidates: context.dropped,
          selectionTrace: context.trace,
          appliedScoreThreshold: context.appliedScoreThreshold,
          appliedBudget: context.appliedBudget,
        }
      }
    }
  }
}
