import type {
  RetrievalPostprocessor,
  RetrievalPostprocessorResult,
} from "../../interfaces/retrieval-postprocessor.js"
import type { AppliedBudget } from "../../spec/stage-result.js"
import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { SelectionTraceItem } from "../../spec/selection-trace.js"
import type { PreprocessedQuery } from "../../spec/preprocessed-query.js"
import type { CandidatePredicate } from "./strategies.js"
import {
  applyScoreThreshold,
  applyBudgetTrim,
  applyPredicateFilter,
  applyNearDuplicateRemoval,
  applySourceCoverage,
} from "./strategies.js"
import { applyContextOrdering } from "./context-ordering.js"

export interface DefaultPostprocessorConfig {
  scoreThreshold?: number
  budget?: AppliedBudget
  predicates?: CandidatePredicate[]
  deduplication?: boolean
  maxPerSource?: number
  orderCandidates?: (a: RetrievalCandidate, b: RetrievalCandidate) => number
}

export function createDefaultPostprocessor(
  config: DefaultPostprocessorConfig = {},
): RetrievalPostprocessor {
  return {
    async postprocess(
      query: PreprocessedQuery,
      candidates: RetrievalCandidate[],
    ): Promise<RetrievalPostprocessorResult> {
      const trace: SelectionTraceItem[] = []
      const allDropped: RetrievalCandidate[] = []
      let working = [...candidates]

      // 1. Score threshold
      if (config.scoreThreshold != null) {
        const result = applyScoreThreshold(working, config.scoreThreshold, trace)
        working = result.kept
        allDropped.push(...result.dropped)
      }

      // 2. Custom predicates
      if (config.predicates) {
        for (const predicate of config.predicates) {
          const result = await applyPredicateFilter(working, predicate, query, trace)
          working = result.kept
          allDropped.push(...result.dropped)
        }
      }

      // 3. Near-duplicate removal
      if (config.deduplication) {
        const result = applyNearDuplicateRemoval(working, trace)
        working = result.kept
        allDropped.push(...result.dropped)
      }

      // 4. Source coverage
      if (config.maxPerSource != null) {
        const result = applySourceCoverage(working, config.maxPerSource, trace)
        working = result.kept
        allDropped.push(...result.dropped)
      }

      // 5. Budget trim
      if (config.budget) {
        const result = applyBudgetTrim(working, config.budget, trace)
        working = result.kept
        allDropped.push(...result.dropped)
      }

      // 6. Context ordering
      const ordered = applyContextOrdering(working, config.orderCandidates, trace)

      // Build promptContext
      const promptContext = ordered.length > 0
        ? ordered.map((c) => c.content).join("\n\n")
        : null

      return {
        candidates: ordered,
        promptContext,
        detail: {
          selectedCandidates: ordered,
          droppedCandidates: allDropped,
          selectionTrace: trace,
          appliedScoreThreshold: config.scoreThreshold,
          appliedBudget: config.budget,
        },
      }
    },
  }
}
