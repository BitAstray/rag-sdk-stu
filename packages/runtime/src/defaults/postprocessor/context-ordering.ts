import type { RetrievalCandidate } from "../../spec/retrieval-candidate.js"
import type { SelectionTraceItem } from "../../spec/selection-trace.js"

export function applyContextOrdering(
  candidates: RetrievalCandidate[],
  comparator: ((a: RetrievalCandidate, b: RetrievalCandidate) => number) | undefined,
  trace: SelectionTraceItem[],
): RetrievalCandidate[] {
  if (candidates.length <= 1) return candidates

  const sorted = comparator
    ? [...candidates].sort(comparator)
    : [...candidates]

  for (let i = 0; i < sorted.length; i++) {
    trace.push({
      stage: "context-ordering",
      action: "reordered",
      candidateId: sorted[i].id,
      metadata: { position: i },
    })
  }

  return sorted
}
