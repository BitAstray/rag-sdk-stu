import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { PostprocessorStep } from "./pipeline.js"

export function contextOrdering(
  comparator?: (a: RetrievalCandidate, b: RetrievalCandidate) => number
): PostprocessorStep {
  return (context) => {
    if (context.candidates.length <= 1) return context

    const trace = [...context.trace]
    const sorted = comparator
      ? [...context.candidates].sort(comparator)
      : [...context.candidates]

    for (let i = 0; i < sorted.length; i++) {
      trace.push({
        stage: "context-ordering",
        action: "reordered",
        candidateId: sorted[i].id,
        metadata: { position: i },
      })
    }

    return {
      ...context,
      candidates: sorted,
      trace,
    }
  }
}
